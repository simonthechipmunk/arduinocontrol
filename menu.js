//***// imports:

// icons and labels
const St = imports.gi.St;

// main functionality
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Lang = imports.lang;

// menu items
const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Slider = imports.ui.slider;

// clutter
const Clutter = imports.gi.Clutter;





//**// Menu Constructor

// Edit the _init() function to your needs to add or remove menu items. Any actor that is receiving data has to be added
// to _ProcessData. Actors that send data need their own function call (i.e. _Switch1Toggle) to push their status to the server.
// Some actors like Switches and Sliders send and also receive data to keep them in sync over the network, so they need both.
// Don't forget to add a unique variable for each item (i.e. "out2") so the server knows what to do with the information. You
// will receive an error message if there's no server side match for a variable.


function ControlMenu(sendfunction, messagetrayfunction) {
	this._Send = sendfunction;
	this._MessageTray = messagetrayfunction;
	this._init();
}

ControlMenu.prototype = {
	__proto__: PopupMenu.PopupMenuSection.prototype,

	_init: function() {
		PopupMenu.PopupMenuSection.prototype._init.call(this, St.Align.START);



		//define sensor/actor variables
		this.Switch1Actor = "out2";
		this.Slider1Actor = "out3";
		this.Sensor1Actor = "sense0";


		// create slider with default value 0
		this.Slider1 = new PopupMenu.PopupMenuItem("");
		this.Slider1Icon = new St.Icon({ icon_name: 'keyboard-brightness-symbolic', 
			style_class: 'popup-menu-icon' });
		this.Slider1.actor.add(this.Slider1Icon);
		this.Slider1Item = new Slider.Slider(0);
		this.Slider1Item.connect('value-changed', Lang.bind(this, this._Slider1Change));
		this.Slider1.actor.add(this.Slider1Item.actor, { expand: true });
		
		
		// create toggle switch
		this.Switch1 = new PopupMenu.PopupSwitchMenuItem("");
		this.Switch1.label.text = 'Light';
		this.Switch1.connect('toggled', Lang.bind(this, this._Switch1Toggle));


		// create menu item for sensor values
		this.Sensor1 = new PopupMenu.PopupMenuItem("", { reactive: false });
		this.Sensor1Icon = new St.Icon({ icon_name: 'media-playlist-consecutive-symbolic',
			y_align: Clutter.ActorAlign.START, style_class: 'popup-menu-icon' });
		this.Sensor1.label.text = 'Sensor ';
		this.Sensor1Item = new St.Label({ text: "--", style_class: "sm-label" });
		this.Sensor1.actor.add(this.Sensor1Icon);
		this.Sensor1.actor.add(this.Sensor1Item);


		// add Switch1, Slider1 and Sensor1 to it
		this.addMenuItem(this.Switch1);
		this.addMenuItem(this.Slider1);
		this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		this.addMenuItem(this.Sensor1);


	},


	_ProcessData: function(data) {
	// Read Server stream and process it

		var splitarray;
		// split received data into actor and value
		splitarray = ("" + data).split(":");

		let switch_set = parseInt(splitarray[1]);
		let slider_set = switch_set / 255;

		if ((splitarray[0] == this.Switch1Actor) && (this.Switch1.state != switch_set)) {
			// handle Switch1
			this.Switch1.setToggleState(switch_set);
			}

		else if ((splitarray[0] == this.Slider1Actor) && (this.Slider1Item.value != slider_set)) {
			// handle Slider1
			this.Slider1Item.setValue(slider_set);
		}
	
		else if (splitarray[0] == this.Sensor1Actor) {
			// update Sensor Data in panelmenu
			this.Sensor1Item.text = splitarray[1];
		}


	 	// error handling
		else if( splitarray[0] == "error") {
					
			this._MessageTray( _("Arduino Control"), _("An Error Code was received from the Server:") + "\n" + data, true);
		}
		
	},
	
	
	_Switch1Toggle: function() {
	// react on switch toggle

		if(this.Switch1.state) {
			this._Send(this.Switch1Actor, 1);
		} 

		else {
			this._Send(this.Switch1Actor, 0);
		}

	},
	
	
	_Slider1Change: function() {
	// react on slider position change

		let sliderval = Math.floor(this.Slider1Item.value * 255);
		this._Send(this.Slider1Actor, sliderval);

	}

}	
	

