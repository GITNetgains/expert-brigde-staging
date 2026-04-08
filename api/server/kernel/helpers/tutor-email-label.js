/**
 * Label for tutor in client-facing emails: public userId (e.g. EB-0103) when
 * showPublicIdOnly is true, otherwise the tutor's display name.
 * Do not use recipient `user.userId` — that is the client, not the expert.
 */
function tutorEmailLabel(tutorUser) {
  if (!tutorUser || typeof tutorUser.getPublicProfile !== 'function') {
    return '';
  }
  const p = tutorUser.getPublicProfile();
  if (p.type === 'tutor' && p.showPublicIdOnly === true) {
    return p.userId || (p._id && p._id.toString()) || '';
  }
  return p.name || '';
}

module.exports = { tutorEmailLabel };
