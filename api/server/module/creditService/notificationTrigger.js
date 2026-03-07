'use strict';

/**
 * Notification Trigger for Credit Service Events
 *
 * The Credit Service (OLD EC2, Python/FastAPI) calls these endpoints
 * to trigger email notifications via the Express mailer (AWS SES).
 *
 * Endpoints:
 *   POST /v1/credit/notify/invoice  — Send invoice email to client
 *   POST /v1/credit/notify/payout   — Send payout email to expert
 *
 * The Credit Service passes mongo IDs; this module looks up emails
 * from MongoDB since it runs on the same server.
 *
 * Added: 2026-03-07
 */

var path = require('path');
var fs = require('fs');
var mailer = require('../../kernel/services/mailer');

var TEMPLATES_DIR = path.join(__dirname, '..', '..', 'emails');

/**
 * Simple template renderer — replaces {{key}} and {{obj.key}} placeholders
 */
function renderTemplate(html, data) {
  return html.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, function(match, key) {
    var parts = key.split('.');
    var val = data;
    for (var i = 0; i < parts.length; i++) {
      if (val == null) return '';
      val = val[parts[i]];
    }
    return val != null ? String(val) : '';
  });
}

/**
 * Wrap body HTML with the standard header/footer layout
 */
function wrapInLayout(bodyHtml) {
  var headerHtml = '';
  var footerHtml = '';
  try {
    headerHtml = fs.readFileSync(path.join(TEMPLATES_DIR, 'includes', 'header.html'), 'utf8');
    footerHtml = fs.readFileSync(path.join(TEMPLATES_DIR, 'includes', 'footer.html'), 'utf8');
  } catch (e) { /* ignore if includes missing */ }

  return '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:auto;font-family:Arial,sans-serif;">'
    + headerHtml + '<tr><td style="padding:24px;">' + bodyHtml + '</td></tr>' + footerHtml + '</table>';
}

/**
 * Look up user email and name from MongoDB by ID
 */
async function lookupUser(mongoId) {
  if (!mongoId || typeof DB === 'undefined' || !DB.User) return null;
  try {
    var user = await DB.User.findById(mongoId, 'email name').lean();
    return user;
  } catch (e) {
    console.warn('[CreditNotify] User lookup failed for', mongoId, e.message);
    return null;
  }
}

/**
 * POST /v1/credit/notify/invoice
 * Send invoice-generated email to client
 *
 * Body: { mongoClientId, invoiceNumber, invoiceDate, expertName, duration,
 *         subtotal, tax, total, currencySymbol }
 * OR:   { clientEmail, clientName, invoiceNumber, ... } (direct email)
 */
exports.sendInvoiceEmail = async function(req, res) {
  try {
    var body = req.body || {};

    // Resolve client email: prefer direct, fall back to MongoDB lookup
    var clientEmail = body.clientEmail;
    var clientName = body.clientName || 'Valued Client';

    if (!clientEmail && body.mongoClientId) {
      var client = await lookupUser(body.mongoClientId);
      if (client) {
        clientEmail = client.email;
        clientName = client.name || clientName;
      }
    }

    var invoiceNumber = body.invoiceNumber;
    if (!clientEmail || !invoiceNumber) {
      return res.status(400).json({ error: 'Client email (or mongoClientId) and invoiceNumber required' });
    }

    var templatePath = path.join(TEMPLATES_DIR, 'payment', 'invoice-generated.html');
    var html = fs.readFileSync(templatePath, 'utf8');

    var data = {
      client: { name: clientName },
      invoice: {
        number: invoiceNumber,
        date: body.invoiceDate || new Date().toISOString().split('T')[0],
        subtotal: body.subtotal || '-',
        tax: body.tax || '-',
        total: body.total || '-'
      },
      booking: {
        expertName: body.expertName || 'Expert',
        duration: body.duration || '-'
      },
      appConfig: {
        currencySymbol: body.currencySymbol || 'Rs.'
      }
    };

    html = renderTemplate(html, data);
    var fullHtml = wrapInLayout(html);

    await mailer.sendRawNow(clientEmail, 'Your ExpertBridge Invoice ' + invoiceNumber, fullHtml);

    console.log('[CreditNotify] Invoice email sent to ' + clientEmail + ' for ' + invoiceNumber);
    return res.json({ success: true, message: 'Invoice email sent', to: clientEmail });
  } catch (err) {
    console.error('[CreditNotify] Invoice email failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * POST /v1/credit/notify/payout
 * Send payout-processed email to expert
 *
 * Body: { mongoExpertId, bookingRef, sessionDate, grossAmount,
 *         commission, tdsAmount, netAmount, currencySymbol, bankLast4, hasPan }
 * OR:   { expertEmail, expertName, ... } (direct email)
 */
exports.sendPayoutEmail = async function(req, res) {
  try {
    var body = req.body || {};

    var expertEmail = body.expertEmail;
    var expertName = body.expertName || 'Expert';

    if (!expertEmail && body.mongoExpertId) {
      var expert = await lookupUser(body.mongoExpertId);
      if (expert) {
        expertEmail = expert.email;
        expertName = expert.name || expertName;
      }
    }

    if (!expertEmail) {
      return res.status(400).json({ error: 'Expert email (or mongoExpertId) required' });
    }

    var templatePath = path.join(TEMPLATES_DIR, 'payout', 'payout-processed.html');
    var html = fs.readFileSync(templatePath, 'utf8');

    var data = {
      expert: { name: expertName },
      booking: {
        code: body.bookingRef || '-',
        date: body.sessionDate || '-'
      },
      payout: {
        grossAmount: body.grossAmount || '-',
        commission: body.commission || '0',
        tdsSection: body.tdsSection || 'Section 194J',
        tdsAmount: body.tdsAmount || '0',
        netAmount: body.netAmount || '-',
        bankLast4: body.bankLast4 || '****',
        hasPan: body.hasPan || false
      },
      appConfig: {
        currencySymbol: body.currencySymbol || 'Rs.'
      }
    };

    html = renderTemplate(html, data);
    var fullHtml = wrapInLayout(html);

    await mailer.sendRawNow(expertEmail, 'Your ExpertBridge Payout Has Been Processed', fullHtml);

    console.log('[CreditNotify] Payout email sent to ' + expertEmail);
    return res.json({ success: true, message: 'Payout email sent', to: expertEmail });
  } catch (err) {
    console.error('[CreditNotify] Payout email failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
