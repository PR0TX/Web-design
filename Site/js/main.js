// main.js
import TimeTrackerModel from './model/TimeTrackerModel.js';
import ProfileModel from './model/ProfileModel.js';
import WorkspaceView from './view/WorkspaceView.js';
import ProfileView from './view/ProfileView.js';
import WorkspaceController from './controller/WorkspaceController.js';
import ProfileController from './controller/ProfileController.js';

const page = document.body.dataset.page;
const trackerModel = new TimeTrackerModel();

if (page === 'workspace') {
  const workspaceView = new WorkspaceView();
  const workspaceController = new WorkspaceController(trackerModel, workspaceView);
  workspaceController.init();
}

if (page === 'profile') {
  const profileView = new ProfileView();
  const profileModel = new ProfileModel(trackerModel);
  const profileController = new ProfileController(trackerModel, profileModel, profileView);
  profileController.init();
}
