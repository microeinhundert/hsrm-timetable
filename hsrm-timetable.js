const VERSION = 'v1.0.3';
const PERSISTENCE_ENABLED = true;
const PRIMARY_COLOR = new Color('c20008');

class HsrmTimetable {
  /**
   * Creates an instance of HsrmTimetable.
   * 
   * @memberof HsrmTimetable
   */
  constructor() {
    this.defaultUsername = '';
    this.defaultPassword = '';
    this.defaultProgram = 'bmm';
    this.defaultSemester = 1;
    this.webUrl = 'https://mm.dcsm.info/';
    this.studipUrl = 'https://studip.hs-rm.de/';
    this.githubRepoUrl = 'https://github.com/microeinhundert/hsrm-timetable/';
    this.fileManager = FileManager.local();
    this.persistenceFolderName = 'hsrmTimetable';
    this.images = [{
      fileName: 'hsrm-logo.png',
      url: 'https://raw.githubusercontent.com/microeinhundert/hsrm-timetable/master/hsrm-logo.png'
    }];
    this.daysOfWeek = [
      'mon',
      'tue',
      'wed',
      'thu',
      'fri',
      'sat',
      'sun'
    ];
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
    this.textStrings = {
      headerTitle: 'Stundenplan',
      headerTitleNext: 'NEXT UP',
      noEvents: 'Du hast heute keine Veranstaltungen',
      noUpcomingEvents: 'Du hast heute keine weiteren Veranstaltungen',
      notLoggedIn: 'Nicht eingeloggt oder falsche Zugangsdaten',
      wrongLogin: 'Falsche Zugangsdaten',
      updateAvailable: 'Update verfügbar',
      oneAdditionalEvent: 'Eine weitere Veranstaltung',
      xAdditionalEvents: '{count} weitere Veranstaltungen',
      seeStudip: 'Siehe Stud.IP',
      startAtX: 'Start: {time}'
    }
  }

  /**
   * Runs the widget.
   * This is the entry to this script.
   *
   * @return {void}
   * @memberof HsrmTimetable
   */
  async run() {
    const widget = await this.renderWidget();

    if (!config.runsInWidget) {
      await widget.presentMedium();
    } else {
      Script.setWidget(widget);
    }

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
    const date = new Date();
    const currentThursday = new Date(date.getTime() + (3 - ((date.getDay() + 6) % 7)) * 86400000);
    const yearOfThursday = currentThursday.getFullYear();
    const firstThursday = new Date(new Date(yearOfThursday, 0, 4).getTime() + (3 - ((new Date(yearOfThursday, 0, 4).getDay() + 6) % 7)) * 86400000);
    const weekNumber = Math.floor(1 + 0.5 + (currentThursday.getTime() - firstThursday.getTime()) / 86400000 / 7);

    return weekNumber;
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
    return config.runsInWidget ? config.widgetFamily === 'medium' : true;
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
   * Checks if there's a script update available on GitHub.
   *
   * @return {Promise<boolean>}
   * @memberof HsrmTimetable
   */
  async checkForUpdate() {
    try {
      const currentVersion = VERSION;
      const latestVersion = await new Request('https://raw.githubusercontent.com/microeinhundert/hsrm-timetable/master/version.txt').loadString();
      return (currentVersion.replace(/[^1-9]+/g, '') < latestVersion.replace(/[^1-9]+/g, '')) ? true : false;
    } catch (error) {
      return false;
    }
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
      username = this.defaultUsername,
      password = this.defaultPassword,
      program = this.defaultProgram,
      semester = this.defaultSemester
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
   * Fetches the image and stores it in storage if it does not already exist.
   *
   * @param {string} fileName
   * @return {Promise<Image>} 
   * @memberof HsrmTimetable
   */
  async getImage(fileName) {
    const dir = this.fileManager.documentsDirectory();
    let path = this.fileManager.joinPath(dir, `${this.persistenceFolderName}/`);

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
   * @return {void} 
   * @memberof HsrmTimetable
   */
  writeToFile(fileName, content) {
    if (!PERSISTENCE_ENABLED) return;

    const dir = this.fileManager.documentsDirectory();
    let path = this.fileManager.joinPath(dir, `${this.persistenceFolderName}/`);

    // Create the persistence directory if it does not already exist
    if (!this.fileManager.fileExists(path)) this.fileManager.createDirectory(path, false);

    path += fileName;

    this.fileManager.writeString(path, JSON.stringify(content));
  }

  /**
   * Reads from a file and returns its JSON content.
   *
   * @param {string} fileName
   * @return {array|Object} 
   * @memberof HsrmTimetable
   */
  readFromFile(fileName) {
    const dir = this.fileManager.documentsDirectory();
    const path = this.fileManager.joinPath(
      dir,
      `${this.persistenceFolderName}/${fileName}`
    );

    if (PERSISTENCE_ENABLED && this.fileManager.fileExists(path)) {
      console.log(`Reading from file "${fileName}"`);
      return JSON.parse(this.fileManager.readString(path));
    }

    return [];
  }

  /**
   * Logs a user in.
   *
   * @param {string} username
   * @param {string} password
   * @return {Promise<Object>} 
   * @memberof HsrmTimetable
   */
  async loginUser(username, password) {
    try {
      const request = new Request(`${this.webUrl}api/login`);
      request.method = 'POST';
      request.addParameterToMultipart('username', username);
      request.addParameterToMultipart('password', password);
      const json = await request.loadJSON();

      return json;
    } catch (error) {
      return { error: this.textStrings.wrongLogin };
    }
  }

  /**
   * Fetches events of a specific week by semester and program.
   *
   * @param {string} token
   * @param {string} program
   * @param {number} semester
   * @param {number} weekNumber
   * @return {Promise<array|Object>} 
   * @memberof HsrmTimetable
   */
  async fetchEvents(token, program, semester, weekNumber) {
    try {
      const request = new Request(
        `${this.webUrl}api/programs/${program}/targetgroups/${program}${semester}/weeks/kw${weekNumber}/events`
      );
      request.method = 'GET';
      request.headers = {
        authorization: `Bearer ${token}`
      };
      const json = await request.loadJSON();

      return json;
    } catch (error) {
      return { error: this.textStrings.notLoggedIn };
    }
  }

  /**
   * Fetches all lecturers.
   *
   * @param {string} token
   * @return {Promise<array|Object>} 
   * @memberof HsrmTimetable
   */
  async fetchLecturers(token) {
    try {
      const request = new Request(`${this.webUrl}api/lecturers`);
      request.method = 'GET';
      request.headers = {
        authorization: `Bearer ${token}`
      };
      const json = await request.loadJSON();

      return json;
    } catch (error) {
      return { error: this.textStrings.notLoggedIn };
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
    return events.filter(
      (event) => 
        this.daysOfWeek.findIndex((day) => day === event.day) === this.currentDayOfWeekNumber 
        && event.shortname 
        && event.timeslots?.length
        && event.lecturers?.length
      );
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
   * @param {number} dayOfWeekNumber
   * @return {Promise<Object>} 
   * @memberof HsrmTimetable
   */
  async getData(program, semester, weekNumber, dayOfWeekNumber) {
    const { username, password } = this.getArgs();

    const eventsFileName = `events-${program}${semester}-kw${weekNumber}-${dayOfWeekNumber}.json`;
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
          events = this.filterEvents(events)
            .map((event) => ({
              id: event.id,
              dayOfWeek: this.currentDayOfWeekNumber,
              name: event.shortname,
              note: event.note,
              rooms: event.rooms,
              lecturers: this.getEventLecturers(event.lecturers, lecturers),
              ...this.getEventTimeslots(event.timeslots)
            }))
            .sort((a, b) => a.startOffset - b.startOffset);

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
   * Gets the url for the current week in the web version.
   *
   * @param {string} program
   * @param {number} semester
   * @param {number} weekNumber
   * @return {string} 
   * @memberof HsrmTimetable
   */
  getWebUrlForWeek(program, semester, weekNumber) {
    return `${this.webUrl}#/programs/${program}/targetgroups/${program}${semester}/weeks/kw${weekNumber}`;
  }

  /**
   * Gets the url for an event in the web version.
   *
   * @param {string} program
   * @param {number} semester
   * @param {number} weekNumber
   * @param {number} eventId
   * @return {string} 
   * @memberof HsrmTimetable
   */
  getWebUrlForEvent(program, semester, weekNumber, eventId) {
    return `${this.getWebUrlForWeek(program, semester, weekNumber)}/show/${eventId}`;
  }

  /**
   * Renders the widget.
   *
   * @return {Promise<Widget>}
   * @memberof HsrmTimetable
   */
  async renderWidget() {
    const { program, semester } = this.getArgs();
    const data = await this.getData(program, semester, this.currentWeekNumber, this.currentDayOfWeekNumber);
    const widget = new ListWidget();
    
    const widgetBackgroundGradient = new LinearGradient();
    widgetBackgroundGradient.locations = [0, 1];
    widgetBackgroundGradient.colors = [
      Color.dynamic(Color.white(), new Color('111111')),
      Color.dynamic(Color.white(), new Color('222222'))
    ];
    widget.backgroundGradient = widgetBackgroundGradient;

    const widgetStack = widget.addStack();
    widgetStack.layoutVertically();
    widgetStack.topAlignContent();
    
    // Show error message if an error occured
    if (data.events.error) {
      widgetStack.addSpacer();

      const errorStack = widgetStack.addStack();
      errorStack.addSpacer();
      const errorText = errorStack.addText(data.events.error);
      errorText.centerAlignText();
      errorStack.addSpacer();

      widgetStack.addSpacer();

      return widget;
    }
    
    if (this.isSmallWidget) {
      await this.renderSmallWidgetContent(data.events, widgetStack, widget);
    } else {
      await this.renderWideWidgetContent(data.events, widgetStack);
    }

    this.setWidgetRefresh(widget);

    return widget;
  }

  /**
   * Gets the type of online event.
   *
   * @param {string} string
   * @return {string}
   * @memberof HsrmTimetable
   */
  getOnlineType(string) {
    const types = {
      zoom: 'Zoom',
      webex: 'Webex',
      teams: 'MS Teams',
      ilias: 'ILIAS'
    };
    const haystack = string.toLowerCase();
    const typesInHaystack = Object.keys(types).map((type) => {
      if (haystack.includes(type)) return types[type];
    });

    return typesInHaystack[0] ?? 'Online';
  }

  /**
   * Renders a room.
   *
   * @param {WidgetStack} parentStack
   * @param {string} roomName
   * @return {void}
   * @memberof HsrmTimetable
   */
  renderRoom(parentStack, roomName) {
    const roomStack = parentStack.addStack();
    roomStack.backgroundColor = PRIMARY_COLOR;
    roomStack.cornerRadius = 4;
    roomStack.setPadding(2, 4, 2, 4);
    const roomNameText = roomStack.addText(roomName);
    roomNameText.font = Font.mediumSystemFont(10);
    roomNameText.textColor = Color.white();
  }

  /**
   * Renders a notice.
   *
   * @param {WidgetStack} parentStack
   * @param {string} text
   * @return {void}
   * @memberof HsrmTimetable
   */
  renderNotice(parentStack, text) {
    let fontSize = 16;

    if (this.isSmallWidget) {
      fontSize = 14;
    } else if (this.isLargeWidget) {
      fontSize = 18;
    }

    const noticeStack = parentStack.addStack();
    noticeStack.addSpacer();
    const noticeText = noticeStack.addText(text);
    noticeText.font = Font.regularSystemFont(fontSize);
    noticeText.centerAlignText();
    noticeStack.addSpacer();
  };

  /**
   * Renders a single event.
   *
   * @param {WidgetStack} parentStack
   * @param {Object} event
   * @param {string} program
   * @param {number} semester
   * @return {void}
   * @memberof HsrmTimetable
   */
  renderEvent(parentStack, event, program, semester) {
    const eventStartTimestamp = this.timestampMidnight + event.startOffset;
    const eventEndTimestamp = this.timestampMidnight + event.endOffset;
    const eventStartTime = this.formatTime(eventStartTimestamp);
    const eventEndTime = this.formatTime(eventEndTimestamp);

    const eventStack = parentStack.addStack();
    eventStack.layoutVertically();
    eventStack.setPadding(6, 0, 6, 0);
    eventStack.url = this.getWebUrlForEvent(program, semester, this.currentWeekNumber, event.id);

    // Top Stack
    const topEventStack = eventStack.addStack();
    topEventStack.centerAlignContent();
    topEventStack.spacing = 10;
    const eventNameText = topEventStack.addText(event.name);
    eventNameText.font = Font.regularSystemFont(this.isMediumWidget ? 15 : 18);
    if (this.timestampNow >= eventStartTimestamp) eventNameText.textColor = PRIMARY_COLOR; // The event is happening now
    topEventStack.addSpacer();
    const eventTimeText = topEventStack.addText(`${eventStartTime}-${eventEndTime}`);
    eventTimeText.font = Font.mediumMonospacedSystemFont(13);
    eventStack.addSpacer(4);

    // Bottom Stack
    const bottomEventStack = eventStack.addStack();
    bottomEventStack.centerAlignContent();
    bottomEventStack.spacing = 10;
    if (event.lecturers.length) {
      const eventLecturerText = bottomEventStack.addText(event.lecturers[0].name);
      eventLecturerText.font = Font.mediumMonospacedSystemFont(13);
      eventLecturerText.textOpacity = 0.5;
    }
    bottomEventStack.addSpacer();

    if (event.rooms.length) {
      event.rooms.forEach((roomName) => this.renderRoom(bottomEventStack, roomName));
    } else {
      this.renderRoom(bottomEventStack, this.getOnlineType(event.note))
    }
  };

  /**
   * Renders the medium and large widget's content.
   *
   * @param {Object[]} events
   * @param {WidgetStack} widgetStack
   * @return {Promise<void>}
   * @memberof HsrmTimetable
   */
  async renderWideWidgetContent(events, widgetStack) {
    const { program, semester } = this.getArgs();

    if (this.isLargeWidget) {
      // Header
      const headerStack = widgetStack.addStack();
      headerStack.centerAlignContent();

      const headerTitleAndLogoStack = headerStack.addStack();
      headerTitleAndLogoStack.centerAlignContent();
      headerTitleAndLogoStack.url = this.getWebUrlForWeek(program, semester, this.currentWeekNumber);
      headerTitleAndLogoStack.spacing = 10;

      const headerLogoImage = headerTitleAndLogoStack.addImage(await this.getImage('hsrm-logo.png'));
      headerLogoImage.imageSize = new Size(25, 25);
      const headerTitleText = headerTitleAndLogoStack.addText(this.textStrings.headerTitle);
      headerTitleText.font = Font.boldSystemFont(18);

      headerStack.addSpacer();

      const headerShortcutImage = headerStack.addImage(SFSymbol.named('book.closed.fill').image);
      headerShortcutImage.imageSize = new Size(18, 18);
      headerShortcutImage.tintColor = Color.dynamic(Color.black(), Color.white());
      headerShortcutImage.url = this.studipUrl;

      widgetStack.addSpacer(20);
    }

    const eventsCountMax = this.isMediumWidget ? 2 : 4;
    const eventsFuture = events
      .filter((event) => (this.timestampMidnight + event.endOffset) >= this.timestampNow);
    const eventsCountHidden = Math.max(0, eventsFuture.length - eventsCountMax);
    
    if (!events.length) {
      widgetStack.addSpacer();
      this.renderNotice(widgetStack, this.textStrings.noEvents);
    } else if (eventsFuture.length) {
      eventsFuture
        .slice(0, eventsCountMax)
        .forEach((event) => this.renderEvent(widgetStack, event, program, semester));
    } else {
      widgetStack.addSpacer();
      this.renderNotice(widgetStack, this.textStrings.noUpcomingEvents);
    }
    
    widgetStack.addSpacer();
    
    // Footer
    const widgetUpdateAvailable = await this.checkForUpdate();
    const footerItems = [this.formatDate(this.timestampNow)];
    if (widgetUpdateAvailable) {
      footerItems.push(this.textStrings.updateAvailable);
    } else if (eventsCountHidden) {
      const footerItem = (eventsCountHidden === 1) 
        ? this.textStrings.oneAdditionalEvent 
        : this.textStrings.xAdditionalEvents.replace('{count}', eventsCountHidden);

      footerItems.push(footerItem);
    }
    const footerText = widgetStack.addText(footerItems.join('  |  '));
    footerText.font = Font.mediumSystemFont(12);
    footerText.textOpacity = 0.5;
    if (widgetUpdateAvailable) footerText.url = this.githubRepoUrl;
  }
  
  /**
   * Renders the small widget's content.
   *
   * @param {Object[]} events
   * @param {WidgetStack} widgetStack
   * @param {Widget} widget
   * @return {void}
   * @memberof HsrmTimetable
   */
  renderSmallWidgetContent(events, widgetStack, widget) {
    const { program, semester } = this.getArgs();

    const eventUpcoming = events
      .find((event) => (this.timestampMidnight + event.startOffset) >= this.timestampNow);

    // Small widgets only support a single tap area
    widget.url = eventUpcoming?.note ? this.getWebUrlForEvent(program, semester, this.currentWeekNumber, eventUpcoming.id) : this.studipUrl;

    if (eventUpcoming) {    
      // Header
      const headerStack = widgetStack.addStack();
      const headerTitleText = headerStack.addText(this.textStrings.headerTitleNext);
      headerTitleText.font = Font.boldSystemFont(13);
      headerTitleText.textColor = Color.dynamic(PRIMARY_COLOR, Color.white());
      
      // Event
      const eventStack = widgetStack.addStack();
      eventStack.layoutVertically();
      const eventNameText = eventStack.addText(eventUpcoming.name);
      eventNameText.font = Font.mediumSystemFont(23);
  
      eventStack.addSpacer();
      
      const eventStartTimestamp = this.timestampMidnight + eventUpcoming.startOffset;
      const eventStartTime = this.formatTime(eventStartTimestamp);
      const eventStartTimeText = eventStack.addText(this.textStrings.startAtX.replace('{time}', eventStartTime));
      eventStartTimeText.font = Font.regularSystemFont(16);

      eventStack.addSpacer(3);

      const eventCharCountMax = 40;
      const eventNoteText = eventStack.addText(eventUpcoming.note.slice(0, eventCharCountMax) + (eventUpcoming.note.length > eventCharCountMax ? '...' : '') || this.textStrings.seeStudip);
      eventNoteText.font = Font.mediumSystemFont(13);
      eventNoteText.textOpacity = 0.5;
    } else if (!events.length) {
      this.renderNotice(widgetStack, this.textStrings.noEvents);
    } else {
      this.renderNotice(widgetStack, this.textStrings.noUpcomingEvents);
    }
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
