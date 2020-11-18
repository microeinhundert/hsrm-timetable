const PERSISTENCE_ENABLED = true; // Change this to "false", run the widget once, and change back to "true" if you have problems
const PERSISTENCE_FOLDER_NAME = 'hsrmTimetable';
const DEFAULT_SEMESTER = 4;
const DEFAULT_PROGRAM = 'bmm';
const STUDIP_URL = 'https://studip.hs-rm.de/';
const PRIMARY_COLOR = new Color('c20008');

class HsrmTimetable {
  /**
   * Creates an instance of HsrmTimetable.
   * 
   * @memberof HsrmTimetable
   */
  constructor() {
    this.fileManager = FileManager.local();

    this.images = [{
      fileName: 'hsrm-logo.png',
      url: 'https://www.dropbox.com/s/pcio8g6lygj27p0/hsrm-logo.png?raw=1'
    }];

    this.timeslots = [
      {
        slot: 1,
        startOffset: 29700000,
        endOffset: 32400000
      },
      {
        slot: 2,
        startOffset: 32400000,
        endOffset: 35100000
      },
      {
        slot: 3,
        startOffset: 36000000,
        endOffset: 38700000
      },
      {
        slot: 4,
        startOffset: 38700000,
        endOffset: 41400000
      },
      {
        slot: 5,
        startOffset: 42300000,
        endOffset: 45000000
      },
      {
        slot: 6,
        startOffset: 45000000,
        endOffset: 47700000
      },
      {
        slot: 7,
        startOffset: 47700000,
        endOffset: 51300000
      },
      {
        slot: 8,
        startOffset: 51300000,
        endOffset: 54000000
      },
      {
        slot: 9,
        startOffset: 54000000,
        endOffset: 56700000
      },
      {
        slot: 10,
        startOffset: 57600000,
        endOffset: 60300000
      },
      {
        slot: 11,
        startOffset: 60300000,
        endOffset: 63000000
      },
      {
        slot: 12,
        startOffset: 63900000,
        endOffset: 66600000
      },
      {
        slot: 13,
        startOffset: 66600000,
        endOffset: 69300000
      }
    ];

    this.daysOfWeek = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  }

  /**
   * Runs the widget.
   * This is the entry to this script.
   *
   * @memberof HsrmTimetable
   */
  async run() {
    const { program, semester } = this.getArgs();

    if (!PERSISTENCE_ENABLED) {
      this.clearPersistenceFolder();
    }

    const widget = await this.renderWidget(program, semester, this.currentWeekNumber);

    if (!config.runsInWidget) {
      await widget.presentLarge();
    }

    Script.setWidget(widget);
    Script.complete();
  }
 
  /**
   * Gets the current day of the week.
   * 0 = Monday, 6 = Sunday
   *
   * @readonly
   * @return {number}
   * @memberof HsrmTimetable
   */
  get currentDayOfWeekNumber() {
    return new Date().getDay() - 1;
  }

  /**
   * Gets the current week number ("Kalenderwoche").
   * 
   * @readonly
   * @return {number}
   * @memberof HsrmTimetable
   */
  get currentWeekNumber() {
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const pastDaysOfYear = (today - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Gets the timestamp at midnight on the current day.
   *
   * @readonly
   * @return {number}
   * @memberof HsrmTimetable
   */
  get timestampMidnight() {
    return +new Date().setHours(0, 0, 0, 0);
  }

  /**
   * Gets the timestamp at midnight on the next day.
   *
   * @readonly
   * @return {number}
   * @memberof HsrmTimetable
   */
  get timestampMidnightTomorrow() {
    return +new Date().setHours(24, 0, 0, 0);
  }

  /**
   * Gets the current timestamp.
   *
   * @readonly
   * @return {number}
   * @memberof HsrmTimetable
   */
  get timestampNow() {
    return Date.now();
  }

  /**
   * Checks if is small widget size.
   *
   * @readonly
   * @return {boolean}
   * @memberof HsrmTimetable
   */
  get isSmallWidget() {
    return config.widgetFamily === 'small';
  }

  /**
   * Checks if is medium widget size.
   *
   * @readonly
   * @return {boolean}
   * @memberof HsrmTimetable
   */
  get isMediumWidget() {
    return config.widgetFamily === 'medium';
  } 

  /**
   * Checks if is large widget size.
   *
   * @readonly
   * @return {boolean}
   * @memberof HsrmTimetable
   */
  get isLargeWidget() {
    return config.widgetFamily === 'large';
  } 

  /**
   * Gets the args as Object split at a speficic delimiter.
   * Format of args: username|password|program|semester
   *
   * @param {string} delimiter
   * @return {Object}
   * @memberof HsrmTimetable
   */
  getArgs(delimiter = '|') {
    const [
      username,
      password,
      program = DEFAULT_PROGRAM,
      semester = DEFAULT_SEMESTER
    ] = args.widgetParameter?.split(delimiter) ?? [];

    return {
      username,
      password,
      program,
      semester
    };
  }

  /**
   * Formats a timestamp to human readable time.
   *
   * @param {number} timestamp
   * @return {string} 
   * @memberof HsrmTimetable
   */
  formatTime(timestamp) {
    const dateFormatter = new DateFormatter();
    dateFormatter.useShortTimeStyle();
    return dateFormatter.string(new Date(timestamp));
  }

  /**
   * Formats a timestamp to human readable date.
   *
   * @param {number} timestamp
   * @return {string} 
   * @memberof HsrmTimetable
   */
  formatDate(timestamp) {
    const dateFormatter = new DateFormatter();
    dateFormatter.useLongDateStyle();
    return dateFormatter.string(new Date(timestamp));
  }

  /**
   * Gets an image by file name. 
   * Fetches the image and stores it in iCloud if it does not already exist.
   *
   * @param {string} fileName
   * @return {Promise<Image>} 
   * @memberof HsrmTimetable
   */
  async getImage(fileName) {
    const dir = this.fileManager.documentsDirectory();
    let path = this.fileManager.joinPath(dir, `${PERSISTENCE_FOLDER_NAME}/`);

    // Create the persistence directory if it does not already exist
    if (!this.fileManager.fileExists(path)) this.fileManager.createDirectory(path, false);

    path += fileName;

    // Get the file from the filesystem if it was already downloaded
    if (PERSISTENCE_ENABLED && this.fileManager.fileExists(path)) return this.fileManager.readImage(path);

    const imageToFetch = this.images.find((image) => image.fileName === fileName);

    if (!imageToFetch?.url) throw new Error(`Could not find image "${fileName}"`);

    const fetchedImage = await this.fetchImage(imageToFetch.url);
    if (PERSISTENCE_ENABLED) this.fileManager.writeImage(path, fetchedImage);

    return fetchedImage;
  }

  /**
   * Fetches an image from an URL and returns it.
   *
   * @param {string} url
   * @return {Promise<Image>} 
   * @memberof HsrmTimetable
   */
  fetchImage(url) {
    const request = new Request(url);
    return request.loadImage();
  }

  /**
   * Writes JSON content to a file.
   *
   * @param {string} fileName
   * @param {array|Object} content
   * @memberof HsrmTimetable
   */
  writeToFile(fileName, content) {
    if (!PERSISTENCE_ENABLED) return;

    const dir = this.fileManager.documentsDirectory();
    let path = this.fileManager.joinPath(dir, `${PERSISTENCE_FOLDER_NAME}/`);

    // Create the persistence directory if it does not already exist
    if (!this.fileManager.fileExists(path)) this.fileManager.createDirectory(path, false);

    path += fileName;

    this.fileManager.writeString(path, JSON.stringify(content));
  }

  /**
   * Reads from a file and returns its JSON content.
   *
   * @param {string} fileName
   * @return {array} 
   * @memberof HsrmTimetable
   */
  readFromFile(fileName) {
    const dir = this.fileManager.documentsDirectory();
    const path = this.fileManager.joinPath(
      dir,
      `${PERSISTENCE_FOLDER_NAME}/${fileName}`
    );

    if (PERSISTENCE_ENABLED && this.fileManager.fileExists(path)) {
      console.log(`Loading data from file "${fileName}"`);
      return JSON.parse(this.fileManager.readString(path));
    }

    return [];
  }

  /**
   * Clears the persistence folder.
   *
   * @return {void} 
   * @memberof HsrmTimetable
   */
  clearPersistenceFolder() {
    const dir = this.fileManager.documentsDirectory();
    const path = this.fileManager.joinPath(dir, `${PERSISTENCE_FOLDER_NAME}/`);
    this.fileManager.remove(path);
  }

  /**
   * Logs a user in.
   *
   * @param {string} username
   * @param {string} password
   * @return {Object} 
   * @memberof HsrmTimetable
   */
  loginUser(username, password) {
    try {
      const request = new Request('https://mm.dcsm.info/api/login');
      request.method = 'POST';
      request.addParameterToMultipart('username', username);
      request.addParameterToMultipart('password', password);

      return request.loadJSON();
    } catch (error) {
      return { error: 'Falsche Zugangsdaten' };
    }
  }

  /**
   * Gets the link to the web version of the timetable.
   *
   * @param {string} program
   * @param {number} semester
   * @param {number} weekNumber
   * @return {string} 
   * @memberof HsrmTimetable
   */
  getWebLink(program, semester, weekNumber) {
    return `https://mm.dcsm.info/#/programs/${program}/targetgroups/${program}${semester}/weeks/kw${weekNumber}`;
  }

  /**
   * Gets the link to an event in the web version.
   *
   * @param {string} program
   * @param {number} semester
   * @param {number} weekNumber
   * @param {number} eventId
   * @return {string} 
   * @memberof HsrmTimetable
   */
  getEventWebLink(program, semester, weekNumber, eventId) {
    return `${this.getWebLink(program, semester, weekNumber)}/show/${eventId}`;
  }

  /**
   * Fetches events of a specific week by semester and program.
   *
   * @param {string} token
   * @param {string} program
   * @param {number} semester
   * @param {number} weekNumber
   * @return {array} 
   * @memberof HsrmTimetable
   */
  fetchEvents(token, program, semester, weekNumber) {
    try {
      const request = new Request(
        `https://mm.dcsm.info/api/programs/${program}/targetgroups/${program}${semester}/weeks/kw${weekNumber}/events`
      );
      request.method = 'GET';
      request.headers = {
        authorization: `Bearer ${token}`
      };

      return request.loadJSON();
    } catch (error) {
      return { error: 'Nicht eingeloggt' };
    }
  }

  /**
   * Fetches all lecturers.
   *
   * @param {string} token
   * @return {array} 
   * @memberof HsrmTimetable
   */
  fetchLecturers(token) {
    try {
      const request = new Request('https://mm.dcsm.info/api/lecturers');
      request.method = 'GET';
      request.headers = {
        authorization: `Bearer ${token}`
      };

      return request.loadJSON();
    } catch (error) {
      return { error: 'Nicht eingeloggt' };
    }
  }

  /**
   * Filters out events that should not be shown.
   *
   * @param {array} events
   * @return {array} 
   * @memberof HsrmTimetable
   */
  filterEvents(events) {
    return events.filter(({ day, shortname, timeslots }) => this.daysOfWeek.includes(day) && shortname && timeslots?.length);
  }

  /**
   * Gets the start and end timeslots from an array of timeslots.
   * Offset is the ellapsed time between midnight and the start/end of the event in milliseconds.
   *
   * @param {array} timeslots
   * @return {Object} 
   * @memberof HsrmTimetable
   */
  getEventTimeslots(timeslots) {
    return timeslots.reduce((acc, timeslotId, index) => {
      const timeslotNumber = timeslotId.split('-')[1];
      const { startOffset, endOffset, slot } = this.timeslots.find(({ slot }) => slot == timeslotNumber);

      if (index === 0) {
        acc.startOffset = startOffset;
        acc.startSlot = slot;
      }
      if (index === (timeslots.length - 1)) {
        acc.endOffset = endOffset;
        acc.endSlot = slot;
      }

      return acc;
    }, {});
  }

  /**
   * Gets lecturers from an array of lecturer ids.
   *
   * @param {array} lecturers
   * @param {array} availableLecturers
   * @return {array} 
   * @memberof HsrmTimetable
   */
  getEventLecturers(lecturers, availableLecturers) {
    return lecturers.map((lecturerId) =>
      availableLecturers.find(({ id }) => id === lecturerId)
    );
  }

  /**
   * Gets the timetable data by fetching and reading from cache.
   * Caching is done by writing to a file.
   *
   * @param {string} program
   * @param {number} semester
   * @param {number} weekNumber
   * @return {Object} 
   * @memberof HsrmTimetable
   */
  async getData(program, semester, weekNumber) {
    const { username, password } = this.getArgs();

    const eventsFileName = `events-${program}${semester}-kw${weekNumber}.json`;
    const lecturersFileName = 'lecturers.json';

    let events = this.readFromFile(eventsFileName);
    let lecturers = this.readFromFile(lecturersFileName);

    if (!lecturers.length || !events.length) {
      const { token } = await this.loginUser(username, password);

      if (!lecturers.length) {
        lecturers = await this.fetchLecturers(token);
        if (!lecturers.error) this.writeToFile(lecturersFileName, lecturers);
      }

      if (!events.length) {
        events = await this.fetchEvents(token, program, semester, weekNumber);

        if (!events.error) {
          events = this.filterEvents(events).map((event) => {
            return {
              id: event.id,
              dayOfWeek: this.daysOfWeek.findIndex((day) => day === event.day),
              name: event.shortname,
              note: event.note,
              rooms: event.rooms,
              lecturers: this.getEventLecturers(event.lecturers, lecturers),
              ...this.getEventTimeslots(event.timeslots)
            }
          });
          this.writeToFile(eventsFileName, events);
        }
      }
    }

    return {
      events,
      lecturers
    };
  }

  /**
   * Renders the widget.
   *
   * @param {string} program
   * @param {number} semester
   * @param {number} weekNumber
   * @return {Widget}
   * @memberof HsrmTimetable
   */
  async renderWidget(program, semester, weekNumber) {
    const data = await this.getData(program, semester, weekNumber);
    const widget = new ListWidget();
    
    const backgroundGradient = new LinearGradient();
    backgroundGradient.locations = [0, 1];
    backgroundGradient.colors = [
      Color.dynamic(Color.white(), new Color('111111')),
      Color.dynamic(Color.white(), new Color('222222')),
     ];
  
    widget.backgroundGradient = backgroundGradient;

    const widgetStack = widget.addStack();
    widgetStack.layoutVertically();
    widgetStack.topAlignContent();

    if (!this.isMediumWidget) {
      const logoSize = this.isSmallWidget ? 18 : 25;
      const textSize = this.isSmallWidget ? 15 : 18;

      // Header
      const headerStack = widgetStack.addStack();
      headerStack.centerAlignContent();
      const titleStack = headerStack.addStack();
      titleStack.url = this.getWebLink(program, semester, weekNumber);
      titleStack.spacing = 10;
      titleStack.centerAlignContent();
      const headerLogo = titleStack.addImage(await this.getImage('hsrm-logo.png'));
      headerLogo.imageSize = new Size(logoSize, logoSize);
      const headerText = titleStack.addText('Stundenplan');
      headerText.font = Font.boldSystemFont(textSize);

      if (!this.isSmallWidget) {
        headerStack.addSpacer();
        const headerSymbol = headerStack.addImage(SFSymbol.named('book.closed.fill').image);
        headerSymbol.imageSize = new Size(18, 18);
        headerSymbol.tintColor = Color.dynamic(Color.black(), Color.white());
        headerSymbol.url = STUDIP_URL;
      }

      widgetStack.addSpacer(20);
    }
    
    // Show an error message if an error occured
    if (data.events.error) {
      const error = widgetStack.addText(data.events.error);
      error.font = Font.mediumSystemFont(13);
      error.textOpacity = 0.5;

      return widget;
    }

    // All events today
    const eventsToday = data.events
      .filter((event) => event.dayOfWeek === this.currentDayOfWeekNumber)
      .sort((a, b) => a.startOffset - b.startOffset);
    
    if (this.isSmallWidget) {
      // Small widget
      widgetStack.addText('Not implemented');
    } else {
      // Medium or large widget
      const renderEvent = (event) => {
        const startTimestamp = this.timestampMidnight + event.startOffset;
        const endTimestamp = this.timestampMidnight + event.endOffset;
        const startTime = this.formatTime(startTimestamp);
        const endTime = this.formatTime(endTimestamp);
  
        const eventStack = widgetStack.addStack();
        eventStack.layoutVertically();
        eventStack.setPadding(6, 0, 6, 0);
        eventStack.url = this.getEventWebLink(program, semester, weekNumber, event.id);
  
        // Top Stack
        const eventStackTop = eventStack.addStack();
        eventStackTop.centerAlignContent();
        eventStackTop.spacing = 10;
        const eventNameText = eventStackTop.addText(event.name);
        eventNameText.font = Font.regularSystemFont(this.isMediumWidget ? 15 : 18);
        // The event is happening now
        if (this.timestampNow >= startTimestamp) eventNameText.textColor = PRIMARY_COLOR;
        eventStackTop.addSpacer();
        const eventTimeText = eventStackTop.addText(`${startTime}-${endTime}`);
        eventTimeText.font = Font.mediumSystemFont(13);
        eventStack.addSpacer(4);
  
        // Bottom Stack
        const eventStackBottom = eventStack.addStack();
        eventStackBottom.centerAlignContent();
        eventStackBottom.spacing = 10;
        if (event.lecturers.length) {
          const lecturerText = eventStackBottom.addText(event.lecturers[0].name);
          lecturerText.font = Font.mediumSystemFont(13);
          lecturerText.textOpacity = 0.5;
        }
        eventStackBottom.addSpacer();
        event.rooms.forEach((room) => {
          const roomStack = eventStackBottom.addStack();
          roomStack.backgroundColor = PRIMARY_COLOR;
          roomStack.cornerRadius = 4;
          roomStack.setPadding(2, 4, 2, 4);
          const roomText = roomStack.addText(room);
          roomText.font = Font.mediumSystemFont(10);
          roomText.textColor = Color.white();
        });
      };
  
      const renderNotice = (text) => {
        widgetStack.addSpacer();
  
        const noticeStack = widgetStack.addStack();
        noticeStack.addSpacer();
        const noticeText = noticeStack.addText(text);
        noticeText.centerAlignText();
        noticeStack.addSpacer();
      };

      const maxEventsToShow = this.isMediumWidget ? 2 : 4;
  
      // The next x events that end in the future
      const eventsWithEndInFuture = eventsToday
        .filter((event) => (this.timestampMidnight + event.endOffset) >= this.timestampNow)
        .slice(0, maxEventsToShow);
      
      if (!eventsToday.length) {
        renderNotice('Du hast heute keine Veranstaltungen');
      } else if (eventsWithEndInFuture.length) {
        eventsWithEndInFuture.forEach((event) => renderEvent(event));
      } else {
        renderNotice('Du hast heute keine weiteren Veranstaltungen');
      }
      
      widgetStack.addSpacer();
      
      // Footer
      const hiddenEventsCount = Math.abs(eventsWithEndInFuture.length - maxEventsToShow);
      const footerItems = [this.formatDate(this.timestampNow)];
      if (hiddenEventsCount) {
        footerItems.push(`${hiddenEventsCount === 1 ? 'Eine weitere Veranstaltung' : `${hiddenEventsCount} weitere Veranstaltungen`}`);
      }
      const footerText = widgetStack.addText(footerItems.join('  |  '));
      footerText.font = Font.mediumSystemFont(12);
      footerText.textOpacity = 0.5;
    }

    this.setWidgetRefresh(widget);

    return widget;
  }

  /**
   * Refreshes the widget on the next timeslot.
   *
   * @param {Widget} widget
   * @return {void} 
   * @memberof HsrmTimetable
   */
  setWidgetRefresh(widget) {
    const upcomingTimeslotIndex = this.timeslots.findIndex((timeslot) => (this.timestampMidnight + timeslot.startOffset) >= this.timestampNow);
    
    if (upcomingTimeslotIndex === -1) {
      // No timeslot left on this day
      widget.refreshAfterDate = new Date(this.timestampMidnightTomorrow);
    } else if (upcomingTimeslotIndex === this.timeslots.length - 1) {
      // The upcoming timeslot is the last on this day
      const timeslot = this.timeslots[upcomingTimeslotIndex];
      widget.refreshAfterDate = new Date(this.timestampMidnight + timeslot.endOffset);
    } else {
      // Upcoming timeslot
      const timeslot = this.timeslots[upcomingTimeslotIndex];
      widget.refreshAfterDate = new Date(this.timestampMidnight + timeslot.startOffset);
    }
  }
}

await new HsrmTimetable().run();
