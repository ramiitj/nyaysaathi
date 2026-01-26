import React from 'react';

const LandingPage = () => {
  return (
    <!DOCTYPE html>
    <html lang="en"><head>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
    <title>Nyay Saathi - Instant Legal First-Aid</title>
    <script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&amp;family=Noto+Sans+Devanagari&amp;family=Noto+Sans+Bengali&amp;family=Noto+Sans+Tamil&amp;family=Noto+Sans+Telugu&amp;family=Noto+Sans+Gujarati&amp;family=Noto+Sans+Kannada&amp;family=Noto+Sans+Malayalam&amp;family=Noto+Sans+Gurmukhi&amp;family=Noto+Sans+Oriya&amp;family=Noto+Nastaliq+Urdu&amp;display=swap" rel="stylesheet"/>
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>
    <script>
            tailwind.config = {
                darkMode: "class",
                theme: {
                    extend: {
                        colors: {
                            primary: "#3B82F6", // Blue shade from the logo
                            "background-light": "#FAF6F1", // Warm light beige
                            "background-dark": "#121212", // Dark gray
                            "card-light": "#FFFFFF",
                            "card-dark": "#1E1E1E",
                            "text-main": "#1F2937",
                            "text-muted": "#6B7280",
                        },
                        fontFamily: {
                            sans: ['Inter', 'sans-serif'],
                            display: ['Inter', 'sans-serif'],
                        },
                        borderRadius: {
                            DEFAULT: "0.75rem", // 12px
                        },
                        boxShadow: {
                            'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
                            'floating': '0 10px 40px -10px rgba(0,0,0,0.1)',
                        }
                    },
                },
            };
        </script>
    <style>.font-hindi { font-family: 'Noto Sans Devanagari', sans-serif; }
            .font-bengali { font-family: 'Noto Sans Bengali', sans-serif; }
            .font-tamil { font-family: 'Noto Sans Tamil', sans-serif; }
            .font-telugu { font-family: 'Noto Sans Telugu', sans-serif; }
            .font-gujarati { font-family: 'Noto Sans Gujarati', sans-serif; }
            .font-kannada { font-family: 'Noto Sans Kannada', sans-serif; }
            .font-malayalam { font-family: 'Noto Sans Malayalam', sans-serif; }
            .font-punjabi { font-family: 'Noto Sans Gurmukhi', sans-serif; }
            .font-odia { font-family: 'Noto Sans Oriya', sans-serif; }
            .font-urdu { font-family: 'Noto Nastaliq Urdu', serif; }
            .bg-pattern {
                background-color: #FAF6F1;
                background-image: radial-gradient(#E5E7EB 1px, transparent 1px);
                background-size: 20px 20px;
            }
            .dark .bg-pattern {
                background-color: #121212;
                background-image: radial-gradient(#333333 1px, transparent 1px);
            }
        </style>
    </head>
    <body className="bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 min-h-screen flex flex-col font-sans transition-colors duration-300">
    <nav className="w-full bg-white/80 dark:bg-card-dark/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 fixed top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between h-16 items-center">
    <div className="flex-shrink-0 flex items-center gap-2">
    <div className="bg-primary text-white p-1.5 rounded-lg">
    <span className="material-icons text-xl">balance</span>
    </div>
    <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">Nyay Saathi</span>
    </div>
    <div className="hidden md:flex space-x-8 items-center">
    <a className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary px-3 py-2 text-sm font-medium transition-colors" href="#">About</a>
    <a className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary px-3 py-2 text-sm font-medium transition-colors" href="#">Services</a>
    <a className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary px-3 py-2 text-sm font-medium transition-colors" href="#">Contact</a>
    <button className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors">
                            Emergency Help
                        </button>
    </div>
    <div className="md:hidden flex items-center">
    <button className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none">
    <span className="material-icons">menu</span>
    </button>
    </div>
    </div>
    </div>
    </nav>
    <main className="flex-grow flex flex-col items-center justify-center relative pt-20 pb-12 px-4 sm:px-6 lg:px-8 bg-pattern">
    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-50 animate-blob"></div>
    <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange-50 dark:bg-orange-900/10 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
    <div className="w-full max-w-2xl relative z-10">
    <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-floating border border-gray-100 dark:border-gray-800 p-8 sm:p-12 text-center transition-all duration-300">
    <div className="mb-8 flex flex-col items-center">
    <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center shadow-lg mb-6 ring-4 ring-blue-50 dark:ring-blue-900/30">
    <span className="material-icons text-white text-3xl">balance</span>
    </div>
    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                            Welcome to Nyay Saathi
                        </h1>
    <p className="text-gray-500 dark:text-gray-400 text-lg">
                            Instant legal first-aid in your language
                        </p>
    </div>
    <div className="grid grid-cols-2 gap-4 mb-8">
    <button className="group relative flex items-center justify-center px-6 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:border-primary hover:shadow-md dark:hover:border-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900">
    <span className="font-hindi text-lg font-medium text-gray-700 dark:text-gray-200 group-hover:text-primary">à¤¹à¤¿à¤à¤¦à¥</span>
    </button>
    <button className="group relative flex items-center justify-center px-6 py-3.5 border-2 border-primary rounded-xl bg-blue-50 dark:bg-blue-900/20 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900">
    <span className="text-lg font-medium text-gray-900 dark:text-white">English</span>
    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 material-icons text-primary text-sm opacity-100">check_circle</span>
    </button>
    <button className="group relative flex items-center justify-center px-6 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:border-primary hover:shadow-md dark:hover:border-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900">
    <span className="font-bengali text-lg font-medium text-gray-700 dark:text-gray-200 group-hover:text-primary">à¦¬à¦¾à¦à¦²à¦¾</span>
    </button>
    <button className="group relative flex items-center justify-center px-6 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:border-primary hover:shadow-md dark:hover:border-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900">
    <span className="font-tamil text-lg font-medium text-gray-700 dark:text-gray-200 group-hover:text-primary">à®¤à®®à®¿à®´à¯</span>
    </button>
    <button className="group relative flex items-center justify-center px-6 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:border-primary hover:shadow-md dark:hover:border-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900">
    <span className="font-telugu text-lg font-medium text-gray-700 dark:text-gray-200 group-hover:text-primary">à°¤à±à°²à±à°à±</span>
    </button>
    <button className="group relative flex items-center justify-center px-6 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:border-primary hover:shadow-md dark:hover:border-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900">
    <span className="font-hindi text-lg font-medium text-gray-700 dark:text-gray-200 group-hover:text-primary">à¤®à¤°à¤¾à¤ à¥</span>
    </button>
    <button className="group relative flex items-center justify-center px-6 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:border-primary hover:shadow-md dark:hover:border-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900">
    <span className="font-gujarati text-lg font-medium text-gray-700 dark:text-gray-200 group-hover:text-primary">àªà«àªàª°àª¾àª¤à«</span>
    </button>
    <button className="group relative flex items-center justify-center px-6 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:border-primary hover:shadow-md dark:hover:border-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900">
    <span className="font-kannada text-lg font-medium text-gray-700 dark:text-gray-200 group-hover:text-primary">à²à²¨à³à²¨à²¡</span>
    </button>
    <button className="group relative flex items-center justify-center px-6 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:border-primary hover:shadow-md dark:hover:border-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900">
    <span className="font-malayalam text-lg font-medium text-gray-700 dark:text-gray-200 group-hover:text-primary">à´®à´²à´¯à´¾à´³à´</span>
    </button>
    <button className="group relative flex items-center justify-center px-6 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:border-primary hover:shadow-md dark:hover:border-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900">
    <span className="font-punjabi text-lg font-medium text-gray-700 dark:text-gray-200 group-hover:text-primary">à¨ªà©°à¨à¨¾à¨¬à©</span>
    </button>
    <button className="group relative flex items-center justify-center px-6 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:border-primary hover:shadow-md dark:hover:border-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900">
    <span className="font-odia text-lg font-medium text-gray-700 dark:text-gray-200 group-hover:text-primary">à¬à¬¡à¬¼à¬¿à¬</span>
    </button>
    <button className="group relative flex items-center justify-center px-6 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:border-primary hover:shadow-md dark:hover:border-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900">
    <span className="font-urdu text-xl leading-none font-medium text-gray-700 dark:text-gray-200 group-hover:text-primary pb-2">Ø§Ø±Ø¯Ù</span>
    </button>
    </div>
    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium">
                        Your trusted legal first-aid companion
                    </p>
    </div>
    <div className="mt-8 flex justify-center space-x-6">
    <a className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary underline" href="#">Privacy Policy</a>
    <a className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary underline" href="#">Terms of Service</a>
    <a className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary underline" href="#">Help Center</a>
    </div>
    </div>
    </main>
    <footer className="bg-white dark:bg-card-dark border-t border-gray-200 dark:border-gray-800 py-6">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
    <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Â© 2026 Nyay Saathi. All rights reserved.
                </p>
    <div className="flex space-x-4">
    <span className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-blue-50 cursor-pointer transition-colors">
    <i className="material-icons text-sm">facebook</i>
    </span>
    <span className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-blue-50 cursor-pointer transition-colors">
    <i className="material-icons text-sm">message</i> 
    </span>
    <span className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-blue-50 cursor-pointer transition-colors">
    <i className="material-icons text-sm">share</i> 
    </span>
    </div>
    </div>
    </footer>

    </body></html>
  );
};

export default LandingPage;