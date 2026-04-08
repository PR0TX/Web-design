// main.js
import TimeTrackerModel from './model/TimeTrackerModel.js';
import ProfileModel from './model/ProfileModel.js';
import AuthModel from './model/AuthModel.js';
import WorkspaceView from './view/WorkspaceView.js';
import ProfileView from './view/ProfileView.js';
import LoginView from './view/LoginView.js';
import RegisterView from './view/RegisterView.js';
import WorkspaceController from './controller/WorkspaceController.js';
import ProfileController from './controller/ProfileController.js';
import LoginController from './controller/LoginController.js';
import RegisterController from './controller/RegisterController.js';
import NavView from './view/NavView.js';
import NavController from './controller/NavController.js';

const page = document.body.dataset.page;
const trackerModel = new TimeTrackerModel();
const authModel = new AuthModel();
const navView = new NavView();
const navController = new NavController(authModel, navView);

navController.init();

if (page === 'workspace') {
  const workspaceView = new WorkspaceView();
  const workspaceController = new WorkspaceController(trackerModel, workspaceView);
  workspaceController.init();
}

if (page === 'profile') {
  const profileView = new ProfileView();
  const profileModel = new ProfileModel(trackerModel);
  const profileController = new ProfileController(trackerModel, profileModel, profileView, authModel);
  profileController.init();
}

if (page === 'login') {
  const loginView = new LoginView();
  const loginController = new LoginController(authModel, loginView);
  loginController.init();
}

if (page === 'register') {
  const registerView = new RegisterView();
  const registerController = new RegisterController(authModel, registerView);
  registerController.init();
}
