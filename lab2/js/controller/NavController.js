// NavController.js
class NavController {
  constructor(authModel, view) {
    this.authModel = authModel;
    this.view = view;
  }

  init() {
    this.view.setAuthenticated(this.authModel.hasAuthenticatedUser());
  }
}

export default NavController;
