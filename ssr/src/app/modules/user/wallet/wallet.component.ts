import { Component, OnInit } from '@angular/core';
import { WalletService } from 'src/app/services/wallet.service';
import { StateService, STATE } from 'src/app/services';

@Component({
  templateUrl: './wallet.html'
})
export class WalletComponent implements OnInit {
  balance: any = null;
  history: any[] = [];
  creditNotes: any[] = [];
  loading = true;
  error = '';
  activeTab = 'wallet';

  constructor(
    private walletService: WalletService,
    private stateService: StateService
  ) {}

  ngOnInit() {
    this.loadWallet();
  }

  async loadWallet() {
    try {
      this.loading = true;
      var [balanceResp, historyResp, cnResp] = await Promise.all([
        this.walletService.getBalance(),
        this.walletService.getHistory(),
        this.walletService.getCreditNotes().catch(() => ({ credit_notes: [] }))
      ]);
      this.balance = balanceResp;
      this.history = (historyResp && historyResp.entries) ? historyResp.entries : [];
      this.creditNotes = (cnResp && cnResp.credit_notes) ? cnResp.credit_notes : [];
    } catch (err: any) {
      console.error('Wallet load error:', err);
      this.error = 'Unable to load wallet data';
    } finally {
      this.loading = false;
    }
  }

  getBalanceAmount(): number {
    if (!this.balance || !this.balance.balances) return 0;
    var clientWallet = this.balance.balances.find(
      (b: any) => b.account_type === 'CLIENT_WALLET'
    );
    if (!clientWallet) return 0;
    return Math.abs(clientWallet.balance_minor || 0);
  }

  formatAmount(minor: number): string {
    return this.walletService.formatAmount(minor);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
