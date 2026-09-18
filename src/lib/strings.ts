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
} as const satisfies Record<string, BilingualText>;

export type StringKey = keyof typeof STRINGS;
