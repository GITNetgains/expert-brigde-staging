exports.toResponse = function (tutor, showPrivate = false, isAdmin = false) {
  const publicData = {
    id: tutor.id,
    _id: tutor._id,
    name: tutor.name,
    userId: tutor.userId,
    showPublicIdOnly: tutor.showPublicIdOnly,
    totalRating: tutor.totalRating,
    username: tutor.username,
    bio: tutor.bio || '',
    avatarUrl: tutor.avatarUrl,
    email: tutor.email,
    phoneNumber: tutor.phoneNumber,
    address: tutor.address,
    subjectIds: tutor.subjectIds,
    subjects: tutor.subjects,
    ratingAvg: tutor.ratingAvg,
    ratingScore: tutor.ratingScore,
    languages: tutor.languages,
    zipCode: tutor.zipCode,
    idYoutube: tutor.idYoutube,
    country: tutor.country,
    gradeItems: tutor.gradeItems,
    grades: tutor.grades,
    featured: tutor.featured,
    isHomePage: tutor.isHomePage,
    education: tutor.education,
    experience: tutor.experience,
    certification: tutor.certification,
    isFavorite: false,
    price1On1Class: tutor.price1On1Class,
    completedByLearner: tutor.completedByLearner,
    categories: tutor.categories,
    introVideo: tutor.introVideo,
    introYoutubeId: tutor.introYoutubeId,
    pendingApprove: tutor.pendingApprove,
    yearsExperience: tutor.yearsExperience,
    highlights: tutor.highlights || [],
    workHistory: tutor.workHistory || []
  };

  const privateData = {
    emailVerified: tutor.emailVerified,
    issueDocument: tutor.issueDocument,
    paypalEmailId: tutor.paypalEmailId,
    timezone: tutor.timezone
  };

  if (tutor.showPublicIdOnly === true) {
    delete publicData.name;
    delete publicData.email;
    delete publicData.phoneNumber;
    delete publicData.avatarUrl;
  }

  if (isAdmin) {
    return Object.assign(tutor, { isFavorite: false });
  }

  if (showPrivate) {
    return { ...publicData, ...privateData };
  }

  return publicData;
};
