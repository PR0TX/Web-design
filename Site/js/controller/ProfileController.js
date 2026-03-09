// ProfileController.js
class ProfileController {
  constructor(timeTrackerModel, profileModel, view) {
    this.timeTrackerModel = timeTrackerModel;
    this.profileModel = profileModel;
    this.view = view;
    this.handleStateChange = this.handleStateChange.bind(this);
  }

  init() {
    this.timeTrackerModel.bindStateChange(this.handleStateChange);
    this.handleStateChange();
  }

  handleStateChange() {
    this.view.render(this.profileModel.getViewModel());
  }
}

export default ProfileController;
