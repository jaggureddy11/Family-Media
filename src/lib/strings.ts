/**
 * Kutumbam · కుటుంబం — Central Bilingual String Catalog
 *
 * NON-NEGOTIABLE RULE:
 * All user-visible strings MUST be defined here as { en, te } pairs and rendered via <Bi>.
 * Hardcoding English or Telugu text anywhere else in the UI is strictly prohibited.
 */

export interface BilingualText {
  en: string;
  te: string;
}

export const STRINGS = {
  // --- Core Top-Level Navigation & Destinations ---
  movies: {
    en: "Movies",
    te: "సినిమాలు",
  },
  photos: {
    en: "Photos",
    te: "ఫోటోలు",
  },
  familyVideos: {
    en: "Family Videos",
    te: "కుటుంబ వీడియోలు",
  },
  otherFiles: {
    en: "Other Files",
    te: "ఇతర ఫైళ్లు",
  },

  // --- Essential Navigation Actions ---
  home: {
    en: "Home",
    te: "హోమ్",
  },
  back: {
    en: "Back",
    te: "వెనుకకు",
  },
  folder: {
    en: "Folder",
    te: "ఫోల్డర్",
  },
  search: {
    en: "Search",
    te: "వెతకండి",
  },
  help: {
    en: "Help",
    te: "సహాయం",
  },

  // --- Playback & Progress ---
  continueWatching: {
    en: "Continue Watching",
    te: "చూడటం కొనసాగించండి",
  },
  play: {
    en: "Play",
    te: "ప్లే చేయండి",
  },
  pause: {
    en: "Pause",
    te: "పాజ్ చేయండి",
  },
  resume: {
    en: "Resume",
    te: "కొనసాగించండి",
  },
  startOver: {
    en: "Start over",
    te: "మొదటి నుండి",
  },
  back10s: {
    en: "Back 10s",
    te: "10 సెకన్లు వెనుకకు",
  },
  forward10s: {
    en: "Forward 10s",
    te: "10 సెకన్లు ముందుకు",
  },
  watchAnother: {
    en: "Watch another",
    te: "మరొకటి చూడండి",
  },
  fullscreen: {
    en: "Fullscreen",
    te: "పూర్తి స్క్రీన్",
  },
  audioAndSubtitles: {
    en: "Audio & Subtitles",
    te: "భాష & ఉపశీర్షికలు",
  },
  subtitlesOff: {
    en: "Subtitles off",
    te: "ఉపశీర్షికలు ఆఫ్",
  },

  // --- Collections, Filters & Photos ---
  favorites: {
    en: "Favorites",
    te: "ఇష్టమైనవి",
  },
  favorite: {
    en: "Favorite",
    te: "ఇష్టమైనది",
  },
  albums: {
    en: "Albums",
    te: "ఆల్బమ్లు",
  },
  timeline: {
    en: "Timeline",
    te: "కాలక్రమం",
  },
  all: {
    en: "All",
    te: "అన్నీ",
  },
  telugu: {
    en: "Telugu",
    te: "తెలుగు",
  },
  next: {
    en: "Next",
    te: "తదుపరిది",
  },
  previous: {
    en: "Previous",
    te: "వెనుకటిది",
  },
  slideshow: {
    en: "Slideshow",
    te: "స్లైడ్షో",
  },

  // --- Files & General Actions ---
  open: {
    en: "Open",
    te: "తెరవండి",
  },
  download: {
    en: "Download",
    te: "డౌన్లోడ్",
  },
  close: {
    en: "Close",
    te: "మూసివేయండి",
  },
  call: {
    en: "Call",
    te: "కాల్ చేయండి",
  },

  // --- States, Feedback & Errors ---
  somethingWentWrong: {
    en: "Something went wrong",
    te: "ఏదో తప్పు జరిగింది",
  },
  tryAgain: {
    en: "Try again",
    te: "మళ్ళీ ప్రయత్నించండి",
  },
  askForHelp: {
    en: "Ask for help",
    te: "సహాయం కోసం అడగండి",
  },
  gettingReady: {
    en: "Getting ready...",
    te: "సిద్ధం చేస్తోంది...",
  },
  movieNotReady: {
    en: "This movie is not ready. Please ask family for help.",
    te: "ఈ సినిమా సిద్ధంగా లేదు. దయచేసి కుటుంబ సభ్యులను అడగండి.",
  },
  noMoviesEmpty: {
    en: "No movies yet. Ask family to add some.",
    te: "ఇంకా సినిమాలు లేవు. కుటుంబ సభ్యులను జోడించమని అడగండి.",
  },
  noPhotosEmpty: {
    en: "No photos yet. Ask family to add some.",
    te: "ఇంకా ఫోటోలు లేవు. కుటుంబ సభ్యులను జోడించమని అడగండి.",
  },
  noVideosEmpty: {
    en: "No videos yet. Ask family to add some.",
    te: "ఇంకా వీడియోలు లేవు. కుటుంబ సభ్యులను జోడించమని అడగండి.",
  },
  noFilesEmpty: {
    en: "No files yet. Ask family to add some.",
    te: "ఇంకా ఫైళ్లు లేవు. కుటుంబ సభ్యులను జోడించమని అడగండి.",
  },
  welcomePrompt: {
    en: "Tap a big picture to start",
    te: "ఒక పెద్ద చిత్రాన్ని తాకండి",
  },
  noInternet: {
    en: "No internet",
    te: "ఇంటర్నెట్ లేదు",
  },

  // --- Low-Vision & Accessibility Controls ---
  biggerLetters: {
    en: "Bigger letters",
    te: "పెద్ద అక్షరాలు",
  },
  textSize: {
    en: "Text size",
    te: "అక్షరాల పరిమాణం",
  },
  highContrast: {
    en: "High contrast",
    te: "హై కాంట్రాస్ట్",
  },
  sizeLarge: {
    en: "Large",
    te: "పెద్దది",
  },
  sizeExtraLarge: {
    en: "Extra Large",
    te: "చాలా పెద్దది",
  },
  sizeHuge: {
    en: "Huge",
    te: "అతి పెద్దది",
  },

  // --- Auth, Device Links & Family Admin ---
  adminLogin: {
    en: "Admin Login",
    te: "అడ్మిన్ లాగిన్",
  },
  passphraseLabel: {
    en: "Admin Passphrase",
    te: "అడ్మిన్ పాస్‌ఫ్రేజ్",
  },
  loginButton: {
    en: "Log in",
    te: "లాగిన్ అవ్వండి",
  },
  invalidPassphrase: {
    en: "Incorrect passphrase. Please try again.",
    te: "తప్పు పాస్‌ఫ్రేజ్. దయచేసి మళ్ళీ ప్రయత్నించండి.",
  },
  tooManyAttempts: {
    en: "Too many attempts. Please try again in 15 minutes.",
    te: "చాలా ప్రయత్నాలు జరిగాయి. 15 నిమిషాల తర్వాత ప్రయత్నించండి.",
  },
  deviceLinkExpired: {
    en: "This link has expired. Ask family to send a new link.",
    te: "ఈ లింక్ గడువు ముగిసింది. కొత్త లింక్ పంపమని కుటుంబ సభ్యులను అడగండి.",
  },
  deviceLinkAlreadyUsed: {
    en: "This link has already been used. Ask family for a new link.",
    te: "ఈ లింక్ ఇప్పటికే ఉపయోగించబడింది. కొత్త లింక్ కోసం కుటుంబ సభ్యులను అడగండి.",
  },
  deviceRevoked: {
    en: "This device has been signed out. Ask family for a new link.",
    te: "ఈ పరికరం సైన్ అవుట్ చేయబడింది. కొత్త లింక్ కోసం కుటుంబ సభ్యులను అడగండి.",
  },
  familyMembers: {
    en: "Family Members",
    te: "కుటుంబ సభ్యులు",
  },
  addFamilyMember: {
    en: "Add Family Member",
    te: "కుటుంబ సభ్యుడిని చేర్చండి",
  },
  createDeviceLink: {
    en: "Create device link",
    te: "లింక్ సృష్టించండి",
  },
  deviceLinkCreated: {
    en: "Device link created! Send this to family:",
    te: "పరికరం లింక్ సృష్టించబడింది! కుటుంబ సభ్యులకు పంపండి:",
  },
  copyLink: {
    en: "Copy link",
    te: "లింక్ కాపీ చేయండి",
  },
  copied: {
    en: "Copied!",
    te: "కాపీ చేయబడింది!",
  },
  sendViaWhatsApp: {
    en: "Send on WhatsApp",
    te: "వాట్సాప్‌లో పంపండి",
  },
  activeDevices: {
    en: "Active Devices",
    te: "యాక్టివ్ పరికరాలు",
  },
  installGuide: {
    en: "Install Guide",
    te: "ఇన్‌స్టాల్ గైడ్",
  },
  signOutDevice: {
    en: "Sign out this device",
    te: "ఈ పరికరాన్ని సైన్ అవుట్ చేయండి",
  },
  deviceSignedOut: {
    en: "Device signed out",
    te: "పరికరం సైన్ అవుట్ చేయబడింది",
  },
  memberName: {
    en: "Member Name",
    te: "సభ్యుని పేరు",
  },
  role: {
    en: "Role",
    te: "పాత్ర",
  },
  lastSeen: {
    en: "Last seen",
    te: "చివరిగా చూసిన సమయం",
  },
  expiresIn: {
    en: "Expires in",
    te: "గడువు ముగిసే సమయం",
  },

  // --- Upload & In-Browser Processing ---
  uploadMedia: {
    en: "Upload Media",
    te: "మీడియాను అప్‌లోడ్ చేయండి",
  },
  uploadPhotosMovies: {
    en: "Upload",
    te: "అప్‌లోడ్",
  },
  uploadPhotosMoviesLong: {
    en: "Upload Photos/Movies",
    te: "ఫోటోలు/సినిమాలు అప్‌లోడ్",
  },
  dragAndDrop: {
    en: "Drag and drop files here, or tap to choose files",
    te: "ఫైళ్లను ఇక్కడ డ్రాగ్ చేయండి, లేదా ఎంచుకోవడానికి నొక్కండి",
  },
  selectFiles: {
    en: "Select Files",
    te: "ఫైళ్లను ఎంచుకోండి",
  },
  selectFolder: {
    en: "Select Folder",
    te: "ఫోల్డర్‌ను ఎంచుకోండి",
  },
  uploading: {
    en: "Uploading...",
    te: "అప్‌లోడ్ అవుతోంది...",
  },
  uploadComplete: {
    en: "Upload complete!",
    te: "అప్‌లోడ్ పూర్తయింది!",
  },
  retry: {
    en: "Retry",
    te: "మళ్ళీ ప్రయత్నించండి",
  },
  cancel: {
    en: "Cancel",
    te: "రద్దు చేయండి",
  },
  handbrakeNoticeTitle: {
    en: "Video Needs Conversion",
    te: "వీడియోను మార్చడం అవసరం",
  },
  handbrakeNoticeDesc: {
    en: "This video is not browser-playable. Convert this with HandBrake, preset Fast 720p30, then upload again.",
    te: "ఈ వీడియో బ్రౌజర్‌లో నేరుగా ప్లే అవ్వదు. దీనిని HandBrake యాప్‌తో (Fast 720p30 ప్రీసెట్) మార్చి, మళ్ళీ అప్‌లోడ్ చేయండి.",
  },
  duplicateWarning: {
    en: "This file has already been uploaded.",
    te: "ఈ ఫైల్ ఇప్పటికే అప్‌లోడ్ చేయబడింది.",
  },
  duplicateNotice: {
    en: "Duplicate detected",
    te: "డూప్లికేట్ ఫైల్ కనుగొనబడింది",
  },
  titleEnglish: {
    en: "English Title",
    te: "ఇంగ్లీష్ శీర్షిక",
  },
  titleTelugu: {
    en: "Telugu Title",
    te: "తెలుగు శీర్షిక",
  },
  releaseYear: {
    en: "Release Year",
    te: "విడుదల సంవత్సరం",
  },
  mediaCategory: {
    en: "Category",
    te: "వర్గం",
  },
  edit: {
    en: "Edit",
    te: "సవరించండి",
  },
  save: {
    en: "Save",
    te: "సేవ్ చేయండి",
  },
  saveChanges: {
    en: "Save Changes",
    te: "మార్పులను భద్రపరచండి",
  },
  deleteItem: {
    en: "Delete Item",
    te: "ఫైల్‌ను తొలగించండి",
  },
  confirmDelete: {
    en: "Are you sure you want to delete this item?",
    te: "మీరు ఖచ్చితంగా ఈ ఫైల్‌ను తొలగించాలనుకుంటున్నారా?",
  },
  library: {
    en: "Media Library",
    te: "మీడియా లైబ్రరీ",
  },
  searchMedia: {
    en: "Search media...",
    te: "శోధించండి...",
  },
  filterByType: {
    en: "Filter by Type",
    te: "రకం ద్వారా ఫిల్టర్ చేయండి",
  },
  filterByStatus: {
    en: "Filter by Status",
    te: "స్థితి ద్వారా ఫిల్టర్ చేయండి",
  },
  itemsCount: {
    en: "items",
    te: "ఫైళ్లు",
  },
  assignAlbum: {
    en: "Assign Album",
    te: "ఆల్బమ్‌కు చేర్చండి",
  },
  newAlbum: {
    en: "New Album",
    te: "కొత్త ఆల్బమ్",
  },
  statusReady: {
    en: "Ready",
    te: "సిద్ధంగా ఉంది",
  },
  statusProcessing: {
    en: "Processing",
    te: "ప్రాసెస్ అవుతోంది",
  },
  statusFailed: {
    en: "Needs Attention",
    te: "పరిశీలన అవసరం",
  },
  speed: {
    en: "Speed",
    te: "వేగం",
  },
  remainingTime: {
    en: "Remaining",
    te: "మిగిలిన సమయం",
  },
  namaste: {
    en: "Namaste",
    te: "నమస్తే",
  },
  resumeFrom: {
    en: "Resume from",
    te: "నుండి కొనసాగించండి",
  },
  voiceSearch: {
    en: "Voice Search",
    te: "వాయిస్ శోధన",
  },
  listening: {
    en: "Listening...",
    te: "వింటోంది...",
  },
  speakNow: {
    en: "Speak now",
    te: "ఇప్పుడు మాట్లాడండి",
  },
  voiceNotSupported: {
    en: "Voice search not supported on this browser",
    te: "ఈ బ్రౌజర్‌లో వాయిస్ సెర్చ్ సపోర్ట్ లేదు",
  },
  clearSearch: {
    en: "Clear search",
    te: "సెర్చ్ క్లియర్ చేయండి",
  },
  subtitles: {
    en: "Subtitles",
    te: "ఉపశీర్షికలు",
  },
  subtitlesOn: {
    en: "Subtitles on",
    te: "ఉపశీర్షికలు ఆన్",
  },
  loadingVideo: {
    en: "Loading video...",
    te: "వీడియో లోడ్ అవుతోంది...",
  },
  playbackFailed: {
    en: "Video playback failed. Please ask family for help.",
    te: "వీడియో ప్లే అవ్వలేదు. దయచేసి కుటుంబ సభ్యుల సహాయం తీసుకోండి.",
  },
  comingSoon: {
    en: "Coming soon",
    te: "త్వరలో వస్తుంది",
  },
  photosDescription: {
    en: "Family photos collection",
    te: "కుటుంబ ఫోటోల సేకరణ",
  },
  familyVideosDescription: {
    en: "Home and family memories",
    te: "కుటుంబ జ్ఞాపకాలు",
  },
  otherFilesDescription: {
    en: "Documents and other family files",
    te: "పత్రాలు మరియు ఇతర ఫైళ్లు",
  },
  searchMovies: {
    en: "Search movies...",
    te: "సినిమాలను వెతకండి...",
  },
  noMoviesFound: {
    en: "No movies found matching your search",
    te: "మీ శోధనకు తగిన సినిమాలు ఏవీ దొరకలేదు",
  },
  allMovies: {
    en: "All Movies",
    te: "అన్ని సినిమాలు",
  },
  playbackError: {
    en: "Playback Error",
    te: "ప్లేబ్యాక్ లోపం",
  },

  // --- Photos, Timeline, Slideshow & Fullscreen Viewer ---
  jumpToYear: {
    en: "Jump to Year",
    te: "సంవత్సరానికి వెళ్ళండి",
  },
  startSlideshow: {
    en: "Slideshow",
    te: "స్లైడ్షో",
  },
  pauseSlideshow: {
    en: "Pause Slideshow",
    te: "స్లైడ్షో పాజ్",
  },
  resumeSlideshow: {
    en: "Resume Slideshow",
    te: "స్లైడ్షో కొనసాగించండి",
  },
  slideIntervalNote: {
    en: "Advances every 6 seconds",
    te: "ప్రతి 6 సెకన్లకు మారుతుంది",
  },
  favorited: {
    en: "Favorited",
    te: "ఇష్టమైనదిగా చేర్చబడింది",
  },
  removeFromFavorites: {
    en: "Remove from Favorites",
    te: "ఇష్టమైన వాటి నుండి తీసివేయండి",
  },
  addToFavorites: {
    en: "Add to Favorites",
    te: "ఇష్టమైన వాటికి చేర్చండి",
  },
  closeViewer: {
    en: "Close Viewer",
    te: "మూసివేయండి",
  },
  photoCount: {
    en: "photos",
    te: "ఫోటోలు",
  },
  videoCount: {
    en: "videos",
    te: "వీడియోలు",
  },
  noFavoritesEmpty: {
    en: "No favorites yet. Tap the heart on any photo or movie to save it here.",
    te: "ఇంకా ఇష్టమైనవి లేవు. ఫోటో లేదా సినిమాపై ఉన్న గుండె గుర్తును తాకండి.",
  },
  yearlyAlbums: {
    en: "Yearly Albums",
    te: "సంవత్సరాల ఆల్బమ్‌లు",
  },
  customAlbums: {
    en: "Family Albums",
    te: "కుటుంబ ఆల్బమ్‌లు",
  },
  noAlbumsEmpty: {
    en: "No albums created yet.",
    te: "ఇంకా ఆల్బమ్‌లు సృష్టించబడలేదు.",
  },
  albumName: {
    en: "Album Name",
    te: "ఆల్బమ్ పేరు",
  },
  albumNameEn: {
    en: "Album Name (English)",
    te: "ఆల్బమ్ పేరు (ఇంగ్లీష్)",
  },
  albumNameTe: {
    en: "Album Name (Telugu)",
    te: "ఆల్బమ్ పేరు (తెలుగు)",
  },
  createAlbum: {
    en: "Create Album",
    te: "కొత్త ఆల్బమ్ సృష్టించండి",
  },
  setAsCover: {
    en: "Set as Cover",
    te: "కవర్ చిత్రంగా పెట్టండి",
  },
  removeFromAlbum: {
    en: "Remove from Album",
    te: "ఆల్బమ్ నుండి తొలగించండి",
  },
  adjustDate: {
    en: "Adjust Date",
    te: "తేదీని మార్చండి",
  },
  viewAllPhotos: {
    en: "View all photos",
    te: "అన్ని ఫోటోలను చూడండి",
  },

  // --- Family Videos ---
  watchVideo: {
    en: "Watch Video",
    te: "వీడియో చూడండి",
  },
  duration: {
    en: "Duration",
    te: "నిడివి",
  },
  allFamilyVideos: {
    en: "All Family Videos",
    te: "అన్ని కుటుంబ వీడియోలు",
  },

  // --- Other Files, PDF Reader & Audio Player ---
  filesAndDocuments: {
    en: "Files & Documents",
    te: "ఫైళ్లు & పత్రాలు",
  },
  folders: {
    en: "Folders",
    te: "ఫోల్డర్లు",
  },
  documents: {
    en: "Documents",
    te: "పత్రాలు",
  },
  audio: {
    en: "Audio & Songs",
    te: "ఆడియో & పాటలు",
  },
  pdfDocument: {
    en: "PDF Document",
    te: "పిడిఎఫ్ పత్రం",
  },
  audioFile: {
    en: "Audio File",
    te: "ఆడియో ఫైల్",
  },
  imageFile: {
    en: "Image File",
    te: "చిత్రం",
  },
  unknownFile: {
    en: "File",
    te: "ఫైల్",
  },
  newFolder: {
    en: "New Folder",
    te: "కొత్త ఫోల్డర్",
  },
  folderName: {
    en: "Folder Name",
    te: "ఫోల్డర్ పేరు",
  },
  createFolder: {
    en: "Create Folder",
    te: "ఫోల్డర్ సృష్టించండి",
  },
  renameFolder: {
    en: "Rename Folder",
    te: "పేరు మార్చండి",
  },
  deleteFolder: {
    en: "Delete Folder",
    te: "ఫోల్డర్ తొలగించండి",
  },
  rootFolder: {
    en: "Main Folder",
    te: "ప్రధాన ఫోల్డర్",
  },
  previousPage: {
    en: "Previous Page",
    te: "మునుపటి పేజీ",
  },
  nextPage: {
    en: "Next Page",
    te: "తదుపరి పేజీ",
  },
  page: {
    en: "Page",
    te: "పేజీ",
  },
  of: {
    en: "of",
    te: "లో",
  },
  zoomIn: {
    en: "Zoom In",
    te: "పెద్దది చేయండి",
  },
  zoomOut: {
    en: "Zoom Out",
    te: "చిన్నది చేయండి",
  },
  openDocument: {
    en: "Open Document",
    te: "పత్రం తెరవండి",
  },
  playAudio: {
    en: "Play Audio",
    te: "ఆడియో వినండి",
  },
  downloadFile: {
    en: "Download File",
    te: "ఫైల్ డౌన్‌లోడ్ చేయండి",
  },
  fileSize: {
    en: "File size",
    te: "ఫైల్ పరిమాణం",
  },
} as const satisfies Record<string, BilingualText>;

export type StringKey = keyof typeof STRINGS;

export const TELUGU_MONTHS = [
  "జనవరి",
  "ఫిబ్రవరి",
  "మార్చి",
  "ఏప్రిల్",
  "మే",
  "జూన్",
  "జూలై",
  "ఆగస్టు",
  "సెప్టెంబర్",
  "అక్టోబర్",
  "నవంబర్",
  "డిసెంబర్",
];

export const ENGLISH_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Formats date into friendly bilingual text:
 * English: "12 March 2019"
 * Telugu: "2019 మార్చి 12"
 */
export function formatBilingualDate(input: Date | string | number): BilingualText {
  const d = new Date(input);
  if (isNaN(d.getTime())) {
    return { en: "Date not set", te: "తేదీ లేదు" };
  }

  const day = d.getDate();
  const monthIdx = d.getMonth();
  const year = d.getFullYear();

  const enMonth = ENGLISH_MONTHS[monthIdx] || "";
  const teMonth = TELUGU_MONTHS[monthIdx] || "";

  return {
    en: `${day} ${enMonth} ${year}`,
    te: `${year} ${teMonth} ${day}`,
  };
}

/**
 * Formats Month + Year header into friendly bilingual text:
 * English: "March 2019"
 * Telugu: "2019 మార్చి"
 */
export function formatBilingualMonthYear(year: number, monthIndex: number): BilingualText {
  const enMonth = ENGLISH_MONTHS[monthIndex] || "";
  const teMonth = TELUGU_MONTHS[monthIndex] || "";

  return {
    en: `${enMonth} ${year}`,
    te: `${year} ${teMonth}`,
  };
}

