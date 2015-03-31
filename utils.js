/*
 * Gnome3 extension utilities
 * 
 * Basic helper functions
 *
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 2 of the License, or (at your option)
 * any later version.
 *
 */


//***// imports:

// utilities for external programs and command line
const Gio = imports.gi.Gio;

// translations
const Config = imports.misc.config;
const Gettext = imports.gettext;

// own imports
const Me = imports.misc.extensionUtils.getCurrentExtension();




//***// basic helper functions

/*
 * _getSettingsSchema:
 * @schema: (optional): the gsettings schema to use
 *
 * Get the settings Schema for gsettings
 * If @schema is not provided, it will be taken from metadata['gsettings-schema']
 */
function _getSettingsSchema(setschema) {
 
    	const GioSSS = Gio.SettingsSchemaSource;

	// get the gsettings schema and path
	let schema = setschema || Me.metadata['settings-schema'];
    	let source = GioSSS.new_from_directory(Me.dir.get_child('schemas').get_path(),
                                           GioSSS.get_default(),
                                           false);


	return new Gio.Settings({
        	settings_schema : source.lookup(schema, true)
    	});

}



/*
 * _initTranslations:
 * @domain: (optional): the gettext domain to use
 *
 * Initialize Gettext to load translations from extensionsdir/locale.
 * If @domain is not provided, it will be taken from metadata['gettext-domain']
 */
function _initTranslations(setdomain) {

	let domain = setdomain || Me.metadata['gettext-domain'];

	// check if this extension was built with "make zip-file", and thus
	// has the locale files in a subfolder
	// otherwise assume that extension has been installed in the
	// same prefix as gnome-shell
	let localeDir = Me.dir.get_child('locale');
	if (localeDir.query_exists(null)) {
		Gettext.bindtextdomain(domain, localeDir.get_path());
	}

	else {
		Gettext.bindtextdomain(domain, Config.LOCALEDIR);
	}

}



