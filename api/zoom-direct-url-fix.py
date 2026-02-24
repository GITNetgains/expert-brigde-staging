import sys

# ============================================
# FIX: Replace Web SDK redirect with direct Zoom URL
# Files: 4 total (2 detail + 2 list components)
# ============================================

# ============================================
# FILE 1: Client lesson detail - joinMeeting()
# ============================================
f1 = '/home/ubuntu/expertbridge/ssr/src/app/modules/user/my-lesson/detail/detail.component.ts'
with open(f1, 'r') as f:
    c1 = f.read()
with open(f1 + '.backup.zoom.20260220', 'w') as f:
    f.write(c1)

old1 = """  joinMeeting() {
    if (!this.joining) {
      this.joining = true;
      this.appointmentService
        .joinMeeting(this.appointment._id)
        .then((resp) => {
          this.joining = false;
          if (
            resp.data &&
            resp.data.platform === 'zoomus' &&
            resp.data['zoomus'].signature
          ) {
            const zoomDisplayName = (this.currentUser.type === 'tutor' && this.currentUser.showPublicIdOnly)
              ? String(this.currentUser.userId || this.currentUser._id)
              : this.currentUser.name;
            const token = encrypt(
              {
                meetingInfo: resp.data['zoomus'],
                appointmentId: this.appointment._id,
                currentUser: { ...pick(this.currentUser, ['email', 'type']), name: zoomDisplayName }
              },
              ''
            );

            window.location.href = `${
              environment.zoomSiteUrl
            }?token=${encodeURIComponent(token)}`;
          } else if (
            resp.data &&
            resp.data.platform === 'lessonspace' &&
            resp.data['lessonspace'].url
          ) {
            localStorage.setItem(
              'lessonSpaceUrl',
              resp.data['lessonspace'].url
            );
            this.router.navigate(['/users/lesson-space'], {
              queryParams: {
                appointmentId: this.appointment._id
              }
            });
          }
        })
        .catch((err) => {
          this.joining = false;
          return this.appService.toastError(err);
        });
    } else {
      this.appService.toastSuccess('Connecting...');
    }
  }"""

new1 = """  joinMeeting() {
    if (!this.joining) {
      this.joining = true;
      this.appointmentService
        .joinMeeting(this.appointment._id)
        .then((resp) => {
          this.joining = false;
          if (
            resp.data &&
            resp.data.platform === 'zoomus' &&
            resp.data['zoomus'].url
          ) {
            window.open(resp.data['zoomus'].url, '_blank');
          } else if (
            resp.data &&
            resp.data.platform === 'lessonspace' &&
            resp.data['lessonspace'].url
          ) {
            localStorage.setItem(
              'lessonSpaceUrl',
              resp.data['lessonspace'].url
            );
            this.router.navigate(['/users/lesson-space'], {
              queryParams: {
                appointmentId: this.appointment._id
              }
            });
          } else {
            this.appService.toastError('Meeting link not available yet. Please wait for the expert to start the meeting.');
          }
        })
        .catch((err) => {
          this.joining = false;
          return this.appService.toastError(err);
        });
    } else {
      this.appService.toastSuccess('Connecting...');
    }
  }"""

if old1 in c1:
    c1 = c1.replace(old1, new1)
    print("FIX 1 APPLIED: my-lesson/detail/detail.component.ts - joinMeeting()")
else:
    print("WARNING: Could not find joinMeeting in lesson detail")

with open(f1, 'w') as f:
    f.write(c1)


# ============================================
# FILE 2: Expert schedule detail - startMeeting()
# ============================================
f2 = '/home/ubuntu/expertbridge/ssr/src/app/modules/user/my-schedule/detail/detail.component.ts'
with open(f2, 'r') as f:
    c2 = f.read()
with open(f2 + '.backup.zoom.20260220', 'w') as f:
    f.write(c2)

old2 = """  startMeeting() {
    if (!this.starting) {
      this.starting = true;
      this.appointmentService
        .startMeeting(this.appointment._id)
        .then((resp) => {
          this.starting = false;
          if (
            resp.data &&
            resp.data.platform === 'zoomus' &&
            resp.data['zoomus'].signature
          ) {
            const zoomDisplayName = (this.currentUser.type === 'tutor' && this.currentUser.showPublicIdOnly)
              ? String(this.currentUser.userId || this.currentUser._id)
              : this.currentUser.name;
            const token = encrypt(
              {
                meetingInfo: resp.data['zoomus'],
                appointmentId: this.appointment._id,
                currentUser: { ...pick(this.currentUser, ['email', 'type']), name: zoomDisplayName }
              },
              ''
            );

            window.location.href = `${
              environment.zoomSiteUrl
            }?token=${encodeURIComponent(token)}`;
          } else if (
            resp.data &&
            resp.data.platform === 'lessonspace' &&
            resp.data['lessonspace'].url
          ) {
            localStorage.setItem(
              'lessonSpaceUrl',
              resp.data['lessonspace'].url
            );
            this.router.navigate(['/users/lesson-space'], {
              queryParams: {
                appointmentId: this.appointment._id
              }
            });
          }
        })
        .catch((err) => {
          this.starting = false;
          this.appService.toastError(err);
        });
    } else {
      this.appService.toastSuccess('Connecting...');
    }
  }"""

new2 = """  startMeeting() {
    if (!this.starting) {
      this.starting = true;
      this.appointmentService
        .startMeeting(this.appointment._id)
        .then((resp) => {
          this.starting = false;
          if (
            resp.data &&
            resp.data.platform === 'zoomus' &&
            resp.data['zoomus'].url
          ) {
            window.open(resp.data['zoomus'].url, '_blank');
          } else if (
            resp.data &&
            resp.data.platform === 'lessonspace' &&
            resp.data['lessonspace'].url
          ) {
            localStorage.setItem(
              'lessonSpaceUrl',
              resp.data['lessonspace'].url
            );
            this.router.navigate(['/users/lesson-space'], {
              queryParams: {
                appointmentId: this.appointment._id
              }
            });
          } else {
            this.appService.toastError('Could not create meeting. Please try again.');
          }
        })
        .catch((err) => {
          this.starting = false;
          this.appService.toastError(err);
        });
    } else {
      this.appService.toastSuccess('Connecting...');
    }
  }"""

if old2 in c2:
    c2 = c2.replace(old2, new2)
    print("FIX 2 APPLIED: my-schedule/detail/detail.component.ts - startMeeting()")
else:
    print("WARNING: Could not find startMeeting in schedule detail")

with open(f2, 'w') as f:
    f.write(c2)


# ============================================
# FILE 3: Client lesson list - joinMeeting()
# ============================================
f3 = '/home/ubuntu/expertbridge/ssr/src/app/modules/user/my-lesson/list/list.component.ts'
with open(f3, 'r') as f:
    c3 = f.read()
with open(f3 + '.backup.zoom.20260220', 'w') as f:
    f.write(c3)

old3 = """  joinMeeting(appointmentId: string) {
    if (!this.joining) {
      this.joining = true;
      this.appointmentService
        .joinMeeting(appointmentId)
        .then((resp) => {
          this.joining = false;
          if (
            resp.data &&
            resp.data.platform === 'zoomus' &&
            resp.data['zoomus'].signature
          ) {
            const zoomDisplayName = (this.currentUser.type === 'tutor' && this.currentUser.showPublicIdOnly)
              ? String(this.currentUser.userId || this.currentUser._id)
              : this.currentUser.name;
            const token = encrypt(
              {
                meetingInfo: resp.data['zoomus'],
                appointmentId,
                currentUser: { ...pick(this.currentUser, ['email', 'type']), name: zoomDisplayName }
              },
              ''
            );

            window.location.href = `${
              environment.zoomSiteUrl
            }?token=${encodeURIComponent(token)}`;
          } else if (
            resp.data &&
            resp.data.platform === 'lessonspace' &&
            resp.data['lessonspace'].url
          ) {
            localStorage.setItem(
              'lessonSpaceUrl',
              resp.data['lessonspace'].url
            );
            this.router.navigate(['/users/lesson-space'], {
              queryParams: {
                appointmentId
              }
            });
          }
        })
        .catch((err) => {
          this.joining = false;
          return this.appService.toastError(err);
        });
    } else {
      this.appService.toastSuccess('Connecting...');
    }
  }"""

new3 = """  joinMeeting(appointmentId: string) {
    if (!this.joining) {
      this.joining = true;
      this.appointmentService
        .joinMeeting(appointmentId)
        .then((resp) => {
          this.joining = false;
          if (
            resp.data &&
            resp.data.platform === 'zoomus' &&
            resp.data['zoomus'].url
          ) {
            window.open(resp.data['zoomus'].url, '_blank');
          } else if (
            resp.data &&
            resp.data.platform === 'lessonspace' &&
            resp.data['lessonspace'].url
          ) {
            localStorage.setItem(
              'lessonSpaceUrl',
              resp.data['lessonspace'].url
            );
            this.router.navigate(['/users/lesson-space'], {
              queryParams: {
                appointmentId
              }
            });
          } else {
            this.appService.toastError('Meeting link not available yet. Please wait for the expert to start the meeting.');
          }
        })
        .catch((err) => {
          this.joining = false;
          return this.appService.toastError(err);
        });
    } else {
      this.appService.toastSuccess('Connecting...');
    }
  }"""

if old3 in c3:
    c3 = c3.replace(old3, new3)
    print("FIX 3 APPLIED: my-lesson/list/list.component.ts - joinMeeting()")
else:
    print("WARNING: Could not find joinMeeting in lesson list")

with open(f3, 'w') as f:
    f.write(c3)


# ============================================
# FILE 4: Expert schedule list - startMeeting()
# ============================================
f4 = '/home/ubuntu/expertbridge/ssr/src/app/modules/user/my-schedule/list/list.component.ts'
with open(f4, 'r') as f:
    c4 = f.read()
with open(f4 + '.backup.zoom.20260220', 'w') as f:
    f.write(c4)

old4 = """  startMeeting(appointmentId: string) {
    if (!this.starting) {
      this.starting = true;
      this.appointmentService
        .startMeeting(appointmentId)
        .then((resp) => {
          this.starting = false;
          if (
            resp.data &&
            resp.data.platform === 'zoomus' &&
            resp.data['zoomus'].signature
          ) {
            const zoomDisplayName = (this.currentUser.type === 'tutor' && this.currentUser.showPublicIdOnly)
              ? String(this.currentUser.userId || this.currentUser._id)
              : this.currentUser.name;
            const token = encrypt(
              {
                meetingInfo: resp.data['zoomus'],
                appointmentId,
                currentUser: { ...pick(this.currentUser, ['email', 'type']), name: zoomDisplayName }
              },
              ''
            );

            window.location.href = `${
              environment.zoomSiteUrl
            }?token=${encodeURIComponent(token)}`;
          } else if (
            resp.data &&
            resp.data.platform === 'lessonspace' &&
            resp.data['lessonspace'].url
          ) {
            localStorage.setItem(
              'lessonSpaceUrl',
              resp.data['lessonspace'].url
            );
            this.router.navigate(['/users/lesson-space'], {
              queryParams: {
                appointmentId
              }
            });
          }
        })
        .catch((err) => {
          this.starting = false;
          return this.appService.toastError(err);
        });
    } else {
      this.appService.toastSuccess('Connecting...');
    }
  }"""

new4 = """  startMeeting(appointmentId: string) {
    if (!this.starting) {
      this.starting = true;
      this.appointmentService
        .startMeeting(appointmentId)
        .then((resp) => {
          this.starting = false;
          if (
            resp.data &&
            resp.data.platform === 'zoomus' &&
            resp.data['zoomus'].url
          ) {
            window.open(resp.data['zoomus'].url, '_blank');
          } else if (
            resp.data &&
            resp.data.platform === 'lessonspace' &&
            resp.data['lessonspace'].url
          ) {
            localStorage.setItem(
              'lessonSpaceUrl',
              resp.data['lessonspace'].url
            );
            this.router.navigate(['/users/lesson-space'], {
              queryParams: {
                appointmentId
              }
            });
          } else {
            this.appService.toastError('Could not create meeting. Please try again.');
          }
        })
        .catch((err) => {
          this.starting = false;
          return this.appService.toastError(err);
        });
    } else {
      this.appService.toastSuccess('Connecting...');
    }
  }"""

if old4 in c4:
    c4 = c4.replace(old4, new4)
    print("FIX 4 APPLIED: my-schedule/list/list.component.ts - startMeeting()")
else:
    print("WARNING: Could not find startMeeting in schedule list")

with open(f4, 'w') as f:
    f.write(c4)


print("\nAll 4 Zoom direct-URL fixes complete!")
