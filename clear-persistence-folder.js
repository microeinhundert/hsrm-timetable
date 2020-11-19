const fileManager = FileManager.local();
const docDir = fileManager.documentsDirectory();
const persistenceFolderName = 'hsrmTimetable';

let message = 'No persistence files to delete.';

if (fileManager.fileExists(`${docDir}/${persistenceFolderName}`)) {
  try {
    await fileManager.remove(`${docDir}/${persistenceFolderName}`);
    message = 'All persistence files deleted!';
  } catch (error) {
    message = `Error while deleting persistence files:\n\n${error}`;
  }
}

const alert = new Alert();
alert.message = `\n${message}`;
alert.title = 'Clear Timetable Persistence Folder';
alert.addAction('OK');
alert.presentAlert();
