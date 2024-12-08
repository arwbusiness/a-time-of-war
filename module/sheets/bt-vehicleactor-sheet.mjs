import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class BTVehicleActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['bt', 'sheet', 'actor', 'vehicle'],
      width: 800,
      height: 650,
	  //dragDrop: [{dragSelector: ".draggable", dropSelector: "crit-slot"}],
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'gameplay',
        },
      ],
    });
  }

	/** @override */
	get template() {
		return `systems/a-time-of-war/templates/actor/VehicleActorSheet.hbs`;
	}

	async _onDropActor(event, data) {
		const element = event.target;

		//You missed.
		//if(!event.target.classList.contains("droppable-actors"))
		//  return;

		//Get the information we need to fetch stats from the dropped actor.
		const uuid = data.uuid.split(".")[1];
		const actor = game.actors.get(uuid);
		
		//Let's see if this element has a real/fake act going on.
		let split = element.id.split("-");
		let real = element;
		let fake = null;
		let fakeImg = null;
		if(split[split.length-1] == "real" || split[split.length-1] == "fake") {
			console.log("HEY!")
			split = split.slice(0, split.length-1);
			let str = "";
			split.forEach(s => { str += s + "-"; });
			real = document.getElementById(str+"real");
			fake = document.getElementById(str+"fake");
			fakeImg = document.getElementById(str+"fake-img");
		}
		console.log("Real: {0}", real);
		if(fake != null)
			console.log("Fake: {0}", fake);
		if(fakeImg != null)
			console.log("FakeImg: {0}", fakeImg);
		
		if(real != null && fake != null) {
			real.style.display = "none";
			fake.style.display = "block";
			real.value = uuid;
			fake.value = actor.name;
			if(fakeImg != null) {
				fakeImg.style.display = "block";
				fakeImg.src = actor.img;
			}
		}
		
		//Time to start actually processing data.
		const vehicle = this.actor.system;
		if(element.classList.contains("pilot-uuid")) {
			this.UpdatePilot(uuid);
		}

		//Live and let live--continue the cycle.
		super._onDropActor(event, data);
	}
	
	//await _onDropActor({ target: target }, { uuid: uuid });
	//target is an element
	//uuid should be obvious, but it's an actor uuid
	/*FakeDropActor(target, uuid) {
		const ev = {
			target: target
		};
		const dt = {
			uuid: uuid
		}
		
		await _onDropActor(ev, dt);
	}*/
	
	UpdatePilot(uuid) {
		const vehicle = this.actor.system;
		const pilot = game.actors.get(uuid);
		const skills = pilot.system.skills;
		
		const driveTypes = ['ground','rail','sea'];
		const gunneryTypes = ['aerospace','air','battlesuit','ground','mech','sea','spacecraft','turret'];
		const gunnery = gunneryTypes.includes(vehicle.type) ? skills["gunnery_"+vehicle.type].level : skills["gunnery_turret"].level;
		const piloting = driveTypes.includes(vehicle.type) ? skills["driving_"+vehicle.type].level : skills["piloting_"+vehicle.type].level;
		const perception = skills["perception"].level;
		const sensorops = skills["sensorops"].level;
		const computers = skills["computers"].level;
		const comms = skills["comms_conventional"].level;
		
		let updateData = {};
		updateData["system.pilot"] = uuid;
		updateData["system.pilot_skills"] = {
			gunnery: gunnery,
			piloting: piloting,
			perception: perception,
			sensorops: sensorops,
			computers: computers,
			comms: comms
		}
		//console.log(updateData);
		
		this.actor.update(updateData);
	}

  /* -------------------------------------------- */

	/** @override */
	async getData() {
		// Retrieve the data structure from the base sheet. You can inspect or log
		// the context variable to see the structure, but some key properties for
		// sheets are the actor object, the data object, whether or not it's
		// editable, the items array, and the effects array.
		const context = super.getData();

		// Use a safe clone of the actor data for further operations.
		const actorData = this.document.toObject(false);
		const systemData = actorData.system;

		// Add the actor's data to context.data for easier access, as well as flags.
		context.system = actorData.system;
		context.flags = actorData.flags;

		// Adding a pointer to CONFIG.BOILERPLATE
		context.config = CONFIG.BT;

		// Prepare character data and items.
		//this._prepareItems(context);
		this.PrepareDerivedData(actorData, systemData);

		/*// Prepare active effects
		context.effects = prepareActiveEffectCategories(
		// A generator that returns all effects stored on the actor
		// as well as any items
			this.actor.allApplicableEffects()
		);*/
		
		this.SortItemsToInventory(context);

		return context;
	}
	
	PrepareDerivedData(actorData, systemData) {
		//console.log(this);
				
		//Calc assigned armour factor
		if(systemData.type != "" && systemData.type != undefined) {
			let assigned = 0;
			
			Object.entries(systemData.locations[systemData.type]).forEach(entry => {
				if(entry[1].armour.assigned != undefined)
					assigned += parseInt(entry[1].armour.assigned);
			});
			systemData.armour.armourfactor.used = assigned;
		}
		
		//this.actor.system.mp.run = Math.ceil(1.5 * this.actor.system.mp.walk);
		
		/*Object.entries(actorData.items).forEach(entry => {
			const item = this.actor.items.get(entry[1]._id);
			let updateData = {};
			updateData["system.location"] = "";
			item.update(updateData);
			console.warn(this.actor.items.get(entry[1]._id));
		});
		console.warn("break");
		console.warn(this.actor.items);*/
	}
	
	SortItemsToInventory(context = null) {
		const weapons = [];
		const equipment = [];
		
		for(let i of this.actor.items) {
			//Near as I can tell, this lets the item retain its img or use the default icon if it doesn't have one of its own.
			i.img = i.img || Item.DEFAULT_ICON;
			
			//Only assigned equipment makes it in
			if(i.location == "")
				return;
			
			switch(i.type) {
				case "vehicle_weapon":
					weapons.push(i);
					break;
				case "vehicle_equipment":
					equipment.push(i);
					break;
				default:
					console.error("Item i {0} type {1} not recognised", i, i.type);
					break;
			}
		}
		
		let inventory = {
			weapons: {},
			equipment: {}
		};
		
		if(context != null) {
			context.inventory = inventory;
			
			context.inventory["weapons"] = weapons;
			context.inventory["equipment"] = equipment;
			
			return null;
		}
		else {
			inventory["weapons"] = weapons;
			inventory["equipment"] = equipment;
			
			return inventory;
		}
	}
	
	/** @override */
	async _onDropItemCreate(itemData) {
		//Forge an array from whatever is in itemData.
		let items = itemData instanceof Array ? itemData : [itemData];
		
		//Initialise an empty array, toCreate, which we'll push into the embedded documents at the end.
		const toCreate = [];
		//For each "item" in the items arrays,
		for (const item of items ) {
			//Call our custom handler function, which tells us if it's ok to drop that item onto the sheet.
			const result = await this.ValidateDroppedItem(item);
			//If we get back a decent result, push that result into the toCreate array!
			if( result )
				toCreate.push(result);
		}
		
		//Push the newly-made items onto the character sheet.
		return this.actor.createEmbeddedDocuments("Item", toCreate);
	}
	
	//Handler to determine if dropped items are valid
	async ValidateDroppedItem(itemData) {
		const valid = ['vehicle_weapon', 'vehicle_equipment'].includes(itemData.type);
		if(!valid) {
			return false;
		}
		else {
			itemData.system.firedThisTurn = false;
			itemData.system.cooling = false;
		}
		console.log(itemData);
		
		return itemData;
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);
		
		//Prep heat.
		let heat = this.actor.system.stats.heat;
		if(heat > 1) {
			for(var i = 29; i >= Math.max(0, 30-heat); i--) {
				let hex = parseInt((256/30)*Math.min(29, i));
				hex = hex.toString(16);
				let colour = "#ff" + (hex < 10 ? "0" : "") + hex + "00";
				const elem = document.getElementById("heat-"+Math.min(29, i));
				elem.style.backgroundColor = colour;
			}
		}
		
		this.HeatEffects();
		this.CalcCarriedWeight();
		let equipped_sinks = 0;
		for(let i of this.actor.items) {
			if(i.system.stats.type == "heatsink" && i.system.location != "")
				equipped_sinks += i.system.stats.subtype == "double" ? 2 : 1;
		}
		this.actor.system.stats.heatsinks = this.CalcFreeHeatSinks(this.actor.system.engine.rating) + equipped_sinks;
		
		if (!this.isEditable)
			return;

		this.ActivateSheetListeners(html);
	}
  
	ActivateSheetListeners(html) {
		const actorData = this.actor;
		const systemData = actorData.system;
		
		let inCombat = false;
		const combats = Object.values(game.combats)[1][0].combats;
		for(var i = 0; i < combats.length && !inCombat; i++)
			for(var t = 0; t < combats[i].turns.length && !inCombat; t++)
				if((combats[i].turns[t].token.actor.id == actorData.id))
					inCombat = true;

		// Rollable abilities.
		html.on('click', '.rollable', this._onRoll.bind(this));
		
		//Dragging items
		if(!inCombat) {
			html.find('.draggable.vehicle-item').each((i, li) => {
				li.setAttribute('draggable', true);
			});
			html.on('dragstart', '.draggable', this.DragStartItem.bind(this));
			html.on('drop', '.slotted', this.DragDropItem.bind(this));
			html.on('drop', '.crit-slot', this.DragDropItem.bind(this));
			html.on('drop', '#inventory', this.UnassignItem.bind(this));
			html.on('contextmenu', '.slotted', this.UnassignItem.bind(this));
		}
		
		//Bind buttons and stuff.
		if(!inCombat)
			html.on('change', '#vehicle-type', this.ChangeVehicleType.bind(this));
		html.on('dblclick', '#pilot-fake', this.TogglePilotSheet.bind(this));
		
		//Check the pilot id, update with the current version of the actor if found and hide the real pilot elements.
		this.RefreshPilot(html, actorData, systemData);
		html.on('click', '#refresh-pilot', this.RefreshPilotManual.bind(this));
		if(!inCombat)
			html.on('click', '#delete-pilot', this.DeletePilot.bind(this));
		
		//Try to make the lists default pick the thing they're supposed to, because they just default to the first option in the list otherwise.
		let typeList = document.getElementById("vehicle-type");
		switch(systemData.type) {
			case "ground":
				typeList.selectedIndex = 0;
				break;
			case "rail":
				typeList.selectedIndex = 1;
				break;
			case "sea":
				typeList.selectedIndex = 2;
				break;
			case "aerospace":
				typeList.selectedIndex = 3;
				break;
			case "air":
				typeList.selectedIndex = 4;
				break;
			case "battlesuit":
				typeList.selectedIndex = 5;
				break;
			case "mech":
				typeList.selectedIndex = 6;
				break;
			case "spacecraft":
				typeList.selectedIndex = 7;
				break;
			default:
				break;
		}
	
		//Update the class based on tonnage
		//This will need reworking to accommodate non-mech vehicles, which don't use these brackets to determine their light/medium/heavy/superheavy class.
		const weight = systemData.tonnage;
		let updateData = {};
		updateData["system.details.class"] = weight <= 35 ? "Light" : weight <= 55 ? "Medium" : weight <= 75 ? "Heavy" : "Assault";
		
		//Prep armour and structure circles with their bound listeners.
		html.on('click', '.circle-armour', this.ToggleArmourCircle.bind(this));
		html.on('click', '.circle-structure', this.ToggleArmourCircle.bind(this));
		
		// Delete Inventory Item
		if(!inCombat)
			html.on('click', '.item-delete', (event) => {
				//Recursively look up whichever of the clicked button's various parents has the item class.
				const li = $(event.currentTarget)[0];
				const item = this.actor.items.get(li.id);
				item.delete();
			});
		
		//Multi-fire buttons
		this.actor.system["selected-weapons"] = {};
		html.on('change', '.select-weapon', this.SelectWeapon.bind(this));
		html.on('click', '#fire-multi', this.FireMultiple.bind(this));
		
		if(!inCombat) {
			//Set speed inputs in MechLab
			html.on('change', '#select-engine-type', this.SelectEngineType(this));
			html.on('change', '#select-gyro-type', this.SelectGyroType(this));
			html.on('change', '#set-mp-walk', this.SetMP.bind(this));
			html.on('change', '#set-mp-jump', this.SetMP.bind(this));
			
			//Tonnage changes armour and structure
			html.on('change', '#vehicle-tonnage', this.SetTonnage.bind(this));
			html.on('change', '#set-armour-weight', this.SetArmourWeight.bind(this));
			html.on('change', '.armour-assigned', this.SetArmourAssigned.bind(this));
		}
	}
	
	async DragStartItem(event) {
		this.actor["draggedItem"] = event.target.id;
	}
	
	async DragDropItem(event) {
		const element = event.target;
		let data = {};
		try {
			data["uuid"] = this.actor["draggedItem"];
		}
		catch (err) {
			return false;
		}
		this.actor["draggedItem"] = null;
		
		if(element.classList.contains("slotted") || element.classList.contains("crit-slot")) {
			const draggedItemId = data.uuid;
			const item = this.actor.items.get(draggedItemId);
			const slots = item.system.stats.slots;
			const previousLocation = item.system.location;
			const newLocation = element.id;
			
			if(element.classList.contains("slotted")) {
				const ev = {
					"currentTarget": {
						"id": draggedItemId
					}
				};
				await this.UnassignItem(ev);
			}
			
			const vehicleType = this.actor.system.type;
			const prevMax = previousLocation != "" ? this.actor.system.locations[vehicleType][previousLocation].slots.max : 999;
			const prevFree = previousLocation != "" ? this.actor.system.locations[vehicleType][previousLocation].slots.free : 999;
			const newMax = this.actor.system.locations[vehicleType][newLocation].slots.max;
			const newFree = this.actor.system.locations[vehicleType][newLocation].slots.free;
			
			if(newFree - slots < 0) {
				ui.notifications.error("Not enough free slots at location");
				return;
			}
			
			//Change the Item's Location
			let updateData = {};
			updateData["system.location"] = newLocation;
			await item.update(updateData);
			console.log(this.actor.items.get(item.id));
			
			//Update the number of free slots
			updateData = {};
			let target = "system.locations." + vehicleType + "." + newLocation + ".slots.free";
			updateData[target] = Math.max(0, newFree - slots);
			if(previousLocation != "") {
				target = "system.locations." + vehicleType + "." + previousLocation + ".slots.free";
				updateData[target] = Math.min(prevMax, slots + prevFree);
			}
			await this.actor.update(updateData);
		}
		else {
			ui.notifications.error("Can't assign equipment: invalid target location.");
			return;
		}
	}
	
	async UnassignItem(event) {
		const element = event.currentTarget;
		const id = this.actor.draggedItem != null ? this.actor.draggedItem : element.id;
		const item = this.actor.items.get(id);
		const location = item.system.location;
		const vehicleType = this.actor.system.type;
		
		let updateData = {};
		updateData["system.location"] = "";
		item.update(updateData);
		
		updateData = {};
		const max = this.actor.system.locations[vehicleType][location].slots.max;
		const free = this.actor.system.locations[vehicleType][location].slots.free;
		updateData["system.locations." + vehicleType + "." + location + ".slots.free"] = Math.min(max, parseInt(free + item.system.stats.slots));
		this.actor.update(updateData);
	}
	
	ChangeVehicleType(event) {
		const element = event.currentTarget;
		const value = element.value;
		
		let updateData = {};
		updateData["system.type"] = value;
		this.actor.update(updateData);
	}
	
	//Opens the pilot's character sheet, if any.
	TogglePilotSheet(event) {
		const element = document.getElementById("pilot-real");
		const value = element.value;
		
		const pilot = game.actors.get(value);
		if(pilot != undefined && pilot != "");
			pilot.sheet.render(true);
	}
	
	RefreshPilotManual(event) {
		const actorData = this.document.toObject(false);
		const systemData = actorData.system;
		this.RefreshPilot(null, actorData, systemData);
	}
	
	DeletePilot(event) {
		let updateData = {};
		updateData["system.pilot"] = "";
		updateData["system.pilot_skills"] = {
			piloting: 3,
			gunnery: 4,
			comms: 2,
			computers: 2,
			perception: 3,
			sensorops: 3
		};
		
		this.actor.update(updateData);
	}
	
	RefreshPilot(html, actorData, systemData) {
		const pilot = game.actors.get(systemData.pilot);
		if(pilot == undefined || pilot == "") {
			this.DeletePilot({});
			return;
		}
		
		let real = null;
		let fake = null;
		if(html != null) {
			const list = Object.entries(html[0]);
			list.forEach(elem => {
				const id = elem[1].id;
				if(id == "pilot-real")
					real = elem[1];
				if(id == "pilot-fake")
					fake = elem[1];
			});
		}
		else {
			real = document.getElementById("pilot-real");
			fake = document.getElementById("pilot-fake");
		}
		
		if(real.value != undefined && real.value != "") {
			const pilotActor = game.actors.get(real.value);
			
			real.style.display = "none";
			fake.style.display = "block";
			fake.value = pilotActor.name;
			this.UpdatePilot(real.value);
			
			const img = document.getElementById("pilot-fake-img");
			img.style.display = "block";
			img.src = pilotActor.img;
		}
	}

	ToggleArmourCircle(event) {
		const element = event.currentTarget;
		
		const actorData = this.actor;
		const systemData = actorData.system;
		
		const split = element.dataset.for.split('-');
		if(split[0] != systemData.type)
		{
			console.error("circle type {0} does not match vehicle type {1}!", type, systemData.type);
			return;
		}
		const location = split[1];
		const type = split[2];
		
		const target = "system.locations." + systemData.type + "." + location + "." + type + ".value";
		let updateData = {};
		updateData[target] = element.classList.contains("circle-blank-" + type) ? parseInt(element.id) : parseInt(element.id) + 1;
		this.actor.update(updateData);
	}
	
	SelectWeapon(event) {
		const element = event.currentTarget;
		const id = element.id;
		
		let checked = false;
		const weapons = document.getElementsByClassName("select-weapon");
		for(var i = 0; (i < weapons.length) && !checked ; i++) {
			if(weapons[i].checked)
				checked = true;
		}
		
		document.getElementById("fire-multi").disabled = !checked;
	}
	
	async FireMultiple(event) {
		const element = event.currentTarget;
		const selected = document.getElementsByClassName("select-weapon");
		console.warn(selected);
		
		//you do the query here and pass the modifiers to each attack afterwards
		const modifiers = await this.QueryModifiers();
		
		for(var i = 0; i < selected.length; i++) {
			if(selected[i].checked)
				await this.RollAttack(selected[i].id, modifiers);
			
			selected[i].checked = false;
		}
	}
	
	async SelectEngineType(event) {
		let updateData = {};
		updateData["system.engine.weight"] = this.CalcEngineWeight(this.actor.system.mp.walk * this.actor.system.tonnage);
		await this.actor.update(updateData);
	}
	
	async SelectGyroType(event) {
		let updateData = {};
		let gyro_mult = 0;
		switch(this.actor.system.engine.gyro_type) {
			case "compact":
				gyro_mult = 1.5;
				break;
			case "xl":
				gyro_mult = 0.5;
				break;
			case "heavy":
				gyro_mult = 2;
				break;
			case "standard":
			default:
				gyro_mult = 1;
				break;
		}
		let gyro_weight = parseFloat(Math.ceil(this.actor.system.engine.rating / 100) * gyro_mult);
		const remainder = gyro_weight - Math.floor(gyro_weight);
		if(remainder > 0)
		{
			if(remainder <= 0.5)
				gyro_weight = Math.floor(gyro_weight) + 0.5;
			else if(remainder > 0.5)
				gyro_weight = Math.ceil(gyro_weight);
		}
		updateData["system.engine.gyro_weight"] = parseFloat(gyro_weight);
		await this.actor.update(updateData);
	}
	
	async SetMP(event) {
		const element = event.currentTarget;
		const which = element.id.split("set-mp-")[1];
		const oldSpeed = which == "walk" ? this.actor.system.mp.walk : this.actor.system.mp.jump;
		const newSpeed = element.value;
		const vehicleType = this.actor.system.type;
		
		//Validating
		if(which == "jump")
		{
			if(vehicleType != "mech") {
				ui.notifications.error("I'm not sure how you managed to get this error, but only mechs can have a jump speed.");
				document.getElementById("set-mp-"+which).value = oldSpeed;
				return;
			}
			if(newSpeed > this.actor.system.mp.walk) {
				ui.notifications.error("Jump speed cannot exceed walk speed!");
				document.getElementById("set-mp-"+which).value = oldSpeed;
				return;
			}
		}
		if(parseFloat(newSpeed) && newSpeed.includes(".")) {
			ui.notifications.error("Walk speed must be a non-decimal integer number!");
			document.getElementById("set-mp-"+which).value = oldSpeed;
			return;
		}
		if(newSpeed == 0 && which != "jump" && vehicleType != "building") {
			ui.notifications.error("Non-building vehicles must have a base speed greater than zero!");
			document.getElementById("set-mp-"+which).value = oldSpeed;
			return;
		}
		
		let updateData = {};
		updateData["system.mp." + which] = newSpeed;
		if(which == "walk") {
			updateData["system.mp.run"] = Math.ceil(1.5 * newSpeed);
			const rating = newSpeed * this.actor.system.tonnage;
			updateData["system.engine.rating"] = rating;
			updateData["system.engine.gyro_weight"] = parseInt(Math.ceil(rating / 100));
			updateData["system.engine.weight"] = this.CalcEngineWeight(newSpeed * this.actor.system.tonnage);
			this.CalcFreeHeatSinks(rating);
			if(newSpeed < this.actor.system.mp.jump)
				updateData["system.mp.jump"] = newSpeed;
		}
		await this.actor.update(updateData);
		document.getElementById("set-mp-"+which).value = newSpeed;
	}
	
	CalcEngineWeight(rating) {
		const type = this.actor.system.engine.type;
		let weight = 999;
		
		if(type == "ice") {
			weight = 0.5;
		}
		else if(type == "cell") {
			weight = 0.5;
		}
		else if(type == "fission") {
			weight = 0.5;
		}
		else if(type == "compact") {
			weight = 0.5;
		}
		else if(type == "standard" || type == "xl") {
			weight = rating >= 10 && rating <= 25 ? 0.5 :
					 rating >= 30 && rating <= 45 ? 1 :
					 rating >= 50 && rating <= 60 ? 1.5 :
					 rating >= 65 && rating <= 75 ? 2 :
					 rating >= 80 && rating <= 85 ? 2.5 :
					 rating >= 90 && rating <= 100 ? 3 :
					 rating >= 105 && rating <= 110 ? 3.5 :
					 rating >= 115 && rating <= 125 ? 4 :
					 rating >= 130 && rating <= 135 ? 4.5 :
					 rating >= 140 && rating <= 145 ? 5 :
					 rating >= 150 && rating <= 155 ? 5.5 :
					 rating >= 160 && rating <= 170 ? 6 :
					 rating >= 175 && rating <= 180 ? 7 :
					 rating >= 185 && rating <= 190 ? 7.5 :
					 rating >= 195 && rating <= 195 ? 8 :
					 rating >= 200 && rating <= 205 ? 8.5 :
					 rating >= 210 && rating <= 210 ? 9 :
					 rating >= 215 && rating <= 215 ? 9.5 :
					 rating >= 220 && rating <= 225 ? 10 :
					 rating >= 230 && rating <= 230 ? 10.5 :
					 rating >= 235 && rating <= 235 ? 11 :
					 rating >= 240 && rating <= 240 ? 11.5 :
					 rating >= 245 && rating <= 245 ? 12 :
					 rating >= 250 && rating <= 250 ? 12.5 :
					 rating >= 255 && rating <= 255 ? 13 :
					 rating >= 260 && rating <= 260 ? 13.5 :
					 rating >= 265 && rating <= 265 ? 14 :
					 rating >= 270 && rating <= 270 ? 14.5 :
					 rating >= 275 && rating <= 275 ? 15.5 :
					 rating >= 280 && rating <= 280 ? 16 :
					 rating >= 285 && rating <= 285 ? 16.5 :
					 rating >= 290 && rating <= 290 ? 17.5 :
					 rating >= 295 && rating <= 295 ? 18 :
					 rating >= 300 && rating <= 300 ? 19 :
					 rating >= 305 && rating <= 305 ? 19.5 :
					 rating >= 310 && rating <= 310 ? 20.5 :
					 rating >= 315 && rating <= 315 ? 21.5 :
					 rating >= 320 && rating <= 320 ? 22.5 :
					 rating >= 325 && rating <= 325 ? 23.5 :
					 rating >= 330 && rating <= 330 ? 24.5 :
					 rating >= 335 && rating <= 335 ? 25.5 :
					 rating >= 340 && rating <= 340 ? 27 :
					 rating >= 345 && rating <= 345 ? 28.5 :
					 rating >= 350 && rating <= 350 ? 29.5 :
					 rating >= 355 && rating <= 355 ? 31.5 :
					 rating >= 360 && rating <= 360 ? 33 :
					 rating >= 365 && rating <= 365 ? 34.5 :
					 rating >= 370 && rating <= 370 ? 36.5 :
					 rating >= 375 && rating <= 375 ? 38.5 :
					 rating >= 380 && rating <= 380 ? 41 :
					 rating >= 385 && rating <= 385 ? 43.5 :
					 rating >= 390 && rating <= 390 ? 46 :
					 rating >= 395 && rating <= 395 ? 49 :
					 rating == 400 					? 52.5 : 999;
		}
		else if(type == "light") {
			weight = 0.5;
		}
		
		if(type == "xl") {
			const oldWeight = weight;
			weight /= 2;
			const remainder = weight - Math.floor(weight);
			if(remainder == 0.25)
				weight = Math.floor(weight) + 0.5;
			else if(remainder == 0.75)
				weight = Math.ceil(weight);
		}
		
		if(weight == 999)
			console.error("Engine type:", type, "not recognised!");
		return weight;
	}
	
	SetTonnage(event) {
		const element = event.currentTarget;
		const value = element.value;
		
		//Weight of the internal structure is 10% of the mech's tonnage, rounding up to the nearest half-ton.
		let weight = value * 0.1;
		let remainder = parseFloat("0." + ("" + weight).split('.')[1]);
		if(remainder != 0 && remainder != 0.5) {
			if(remainder < 0.5)
				weight = Math.floor(weight) + 0.5;
			else if(remainder > 0.5)
				weight = Math.ceil(weight);
		}
		
		//Endo Steel structure halves the weight of the internal structure, rounding up to the nearest half-ton.
		if(this.actor.system.armour.structure_type == "endo") {
			weight /= 2;
			let remainder = weight - Math.floor(weight);
			if(remainder == 0.75)
				weight = Math.ceil(weight);
			else if(remainder == 0.25)
				weight = Math.floor(weight) + 0.5;
		}
		
		let updateData = {};
		updateData["system.armour.structure_weight"] = weight;
		
		//Different vehicles have different structure values per location.
		const vehicleType = this.actor.system.type;
		if(vehicleType == "mech") {
			updateData["system.locations.mech.head.structure.max"] = 3;
			switch(this.actor.system.tonnage) {
				case 20:
					updateData["system.locations.mech.torso_c.structure.max"] = 6;
					updateData["system.locations.mech.torso_l.structure.max"] = 5;
					updateData["system.locations.mech.torso_r.structure.max"] = 5;
					updateData["system.locations.mech.arm_l.structure.max"] = 3;
					updateData["system.locations.mech.arm_r.structure.max"] = 3;
					updateData["system.locations.mech.leg_l.structure.max"] = 4;
					updateData["system.locations.mech.leg_r.structure.max"] = 4;
					break;
				case 25:
					updateData["system.locations.mech.torso_c.structure.max"] = 8;
					updateData["system.locations.mech.torso_l.structure.max"] = 6;
					updateData["system.locations.mech.torso_r.structure.max"] = 6;
					updateData["system.locations.mech.arm_l.structure.max"] = 4;
					updateData["system.locations.mech.arm_r.structure.max"] = 4;
					updateData["system.locations.mech.leg_l.structure.max"] = 6;
					updateData["system.locations.mech.leg_r.structure.max"] = 6;
					break;
				case 30:
					updateData["system.locations.mech.torso_c.structure.max"] = 10;
					updateData["system.locations.mech.torso_l.structure.max"] = 7;
					updateData["system.locations.mech.torso_r.structure.max"] = 7;
					updateData["system.locations.mech.arm_l.structure.max"] = 5;
					updateData["system.locations.mech.arm_r.structure.max"] = 5;
					updateData["system.locations.mech.leg_l.structure.max"] = 7;
					updateData["system.locations.mech.leg_r.structure.max"] = 7;
					break;
				case 35:
					updateData["system.locations.mech.torso_c.structure.max"] = 11;
					updateData["system.locations.mech.torso_l.structure.max"] = 8;
					updateData["system.locations.mech.torso_r.structure.max"] = 8;
					updateData["system.locations.mech.arm_l.structure.max"] = 6;
					updateData["system.locations.mech.arm_r.structure.max"] = 6;
					updateData["system.locations.mech.leg_l.structure.max"] = 8;
					updateData["system.locations.mech.leg_r.structure.max"] = 8;
					break;
				case 40:
					updateData["system.locations.mech.torso_c.structure.max"] = 12;
					updateData["system.locations.mech.torso_l.structure.max"] = 10;
					updateData["system.locations.mech.torso_r.structure.max"] = 10;
					updateData["system.locations.mech.arm_l.structure.max"] = 6;
					updateData["system.locations.mech.arm_r.structure.max"] = 6;
					updateData["system.locations.mech.leg_l.structure.max"] = 10;
					updateData["system.locations.mech.leg_r.structure.max"] = 10;
					break;
				case 45:
					updateData["system.locations.mech.torso_c.structure.max"] = 14;
					updateData["system.locations.mech.torso_l.structure.max"] = 11;
					updateData["system.locations.mech.torso_r.structure.max"] = 11;
					updateData["system.locations.mech.arm_l.structure.max"] = 7;
					updateData["system.locations.mech.arm_r.structure.max"] = 7;
					updateData["system.locations.mech.leg_l.structure.max"] = 11;
					updateData["system.locations.mech.leg_r.structure.max"] = 11;
					break;
				case 50:
					updateData["system.locations.mech.torso_c.structure.max"] = 16;
					updateData["system.locations.mech.torso_l.structure.max"] = 12;
					updateData["system.locations.mech.torso_r.structure.max"] = 12;
					updateData["system.locations.mech.arm_l.structure.max"] = 8;
					updateData["system.locations.mech.arm_r.structure.max"] = 8;
					updateData["system.locations.mech.leg_l.structure.max"] = 12;
					updateData["system.locations.mech.leg_r.structure.max"] = 12;
					break;
				case 55:
					updateData["system.locations.mech.torso_c.structure.max"] = 18;
					updateData["system.locations.mech.torso_l.structure.max"] = 13;
					updateData["system.locations.mech.torso_r.structure.max"] = 13;
					updateData["system.locations.mech.arm_l.structure.max"] = 9;
					updateData["system.locations.mech.arm_r.structure.max"] = 9;
					updateData["system.locations.mech.leg_l.structure.max"] = 13;
					updateData["system.locations.mech.leg_r.structure.max"] = 13;
					break;
				case 60:
					updateData["system.locations.mech.torso_c.structure.max"] = 20;
					updateData["system.locations.mech.torso_l.structure.max"] = 14;
					updateData["system.locations.mech.torso_r.structure.max"] = 14;
					updateData["system.locations.mech.arm_l.structure.max"] = 10;
					updateData["system.locations.mech.arm_r.structure.max"] = 10;
					updateData["system.locations.mech.leg_l.structure.max"] = 14;
					updateData["system.locations.mech.leg_r.structure.max"] = 14;
					break;
				case 65:
					updateData["system.locations.mech.torso_c.structure.max"] = 21;
					updateData["system.locations.mech.torso_l.structure.max"] = 15;
					updateData["system.locations.mech.torso_r.structure.max"] = 15;
					updateData["system.locations.mech.arm_l.structure.max"] = 10;
					updateData["system.locations.mech.arm_r.structure.max"] = 10;
					updateData["system.locations.mech.leg_l.structure.max"] = 15;
					updateData["system.locations.mech.leg_r.structure.max"] = 15;
					break;
				case 70:
					updateData["system.locations.mech.torso_c.structure.max"] = 22;
					updateData["system.locations.mech.torso_l.structure.max"] = 15;
					updateData["system.locations.mech.torso_r.structure.max"] = 15;
					updateData["system.locations.mech.arm_l.structure.max"] = 11;
					updateData["system.locations.mech.arm_r.structure.max"] = 11;
					updateData["system.locations.mech.leg_l.structure.max"] = 15;
					updateData["system.locations.mech.leg_r.structure.max"] = 15;
					break;
				case 75:
					updateData["system.locations.mech.torso_c.structure.max"] = 23;
					updateData["system.locations.mech.torso_l.structure.max"] = 16;
					updateData["system.locations.mech.torso_r.structure.max"] = 16;
					updateData["system.locations.mech.arm_l.structure.max"] = 12;
					updateData["system.locations.mech.arm_r.structure.max"] = 12;
					updateData["system.locations.mech.leg_l.structure.max"] = 16;
					updateData["system.locations.mech.leg_r.structure.max"] = 16;
					break;
				case 80:
					updateData["system.locations.mech.torso_c.structure.max"] = 25;
					updateData["system.locations.mech.torso_l.structure.max"] = 17;
					updateData["system.locations.mech.torso_r.structure.max"] = 17;
					updateData["system.locations.mech.arm_l.structure.max"] = 13;
					updateData["system.locations.mech.arm_r.structure.max"] = 13;
					updateData["system.locations.mech.leg_l.structure.max"] = 17;
					updateData["system.locations.mech.leg_r.structure.max"] = 17;
					break;
				case 85:
					updateData["system.locations.mech.torso_c.structure.max"] = 27;
					updateData["system.locations.mech.torso_l.structure.max"] = 18;
					updateData["system.locations.mech.torso_r.structure.max"] = 18;
					updateData["system.locations.mech.arm_l.structure.max"] = 14;
					updateData["system.locations.mech.arm_r.structure.max"] = 14;
					updateData["system.locations.mech.leg_l.structure.max"] = 18;
					updateData["system.locations.mech.leg_r.structure.max"] = 18;
					break;
				case 90:
					updateData["system.locations.mech.torso_c.structure.max"] = 29;
					updateData["system.locations.mech.torso_l.structure.max"] = 19;
					updateData["system.locations.mech.torso_r.structure.max"] = 19;
					updateData["system.locations.mech.arm_l.structure.max"] = 15;
					updateData["system.locations.mech.arm_r.structure.max"] = 15;
					updateData["system.locations.mech.leg_l.structure.max"] = 19;
					updateData["system.locations.mech.leg_r.structure.max"] = 19;
					break;
				case 95:
					updateData["system.locations.mech.torso_c.structure.max"] = 30;
					updateData["system.locations.mech.torso_l.structure.max"] = 20;
					updateData["system.locations.mech.torso_r.structure.max"] = 20;
					updateData["system.locations.mech.arm_l.structure.max"] = 16;
					updateData["system.locations.mech.arm_r.structure.max"] = 16;
					updateData["system.locations.mech.leg_l.structure.max"] = 20;
					updateData["system.locations.mech.leg_r.structure.max"] = 20;
					break;
				case 100:
					updateData["system.locations.mech.torso_c.structure.max"] = 31;
					updateData["system.locations.mech.torso_l.structure.max"] = 21;
					updateData["system.locations.mech.torso_r.structure.max"] = 21;
					updateData["system.locations.mech.arm_l.structure.max"] = 17;
					updateData["system.locations.mech.arm_r.structure.max"] = 17;
					updateData["system.locations.mech.leg_l.structure.max"] = 21;
					updateData["system.locations.mech.leg_r.structure.max"] = 21;
					break;
				default:
					console.error("Yeah, I dunno how you broke this one. Tonnage was invalid.");
					return;
			}
			updateData["system.locations.mech.head.structure.max"] = 3;
			updateData["system.locations.mech.head.armour.max"] = 9;
			updateData["system.locations.mech.torso_c.armour.max"] = 2 * updateData["system.locations.mech.torso_c.structure.max"];
			updateData["system.locations.mech.torso_l.armour.max"] = 2 * updateData["system.locations.mech.torso_l.structure.max"];
			updateData["system.locations.mech.torso_r.armour.max"] = 2 * updateData["system.locations.mech.torso_r.structure.max"];
			updateData["system.locations.mech.rear_c.armour.max"] = 2 * updateData["system.locations.mech.torso_c.structure.max"];
			updateData["system.locations.mech.rear_l.armour.max"] = 2 * updateData["system.locations.mech.torso_l.structure.max"];
			updateData["system.locations.mech.rear_r.armour.max"] = 2 * updateData["system.locations.mech.torso_r.structure.max"];
			updateData["system.locations.mech.arm_l.armour.max"] = 2 * updateData["system.locations.mech.arm_l.structure.max"];
			updateData["system.locations.mech.arm_r.armour.max"] = 2 * updateData["system.locations.mech.arm_r.structure.max"];
			updateData["system.locations.mech.leg_l.armour.max"] = 2 * updateData["system.locations.mech.leg_l.structure.max"];
			updateData["system.locations.mech.leg_r.armour.max"] = 2 * updateData["system.locations.mech.leg_r.structure.max"];
			updateData["system.armour.maxarmour"] = updateData["system.locations.mech.leg_r.armour.max"]
												  + updateData["system.locations.mech.leg_l.armour.max"]
												  + updateData["system.locations.mech.arm_r.armour.max"]
												  + updateData["system.locations.mech.arm_l.armour.max"]
												  + updateData["system.locations.mech.torso_r.armour.max"]
												  + updateData["system.locations.mech.torso_l.armour.max"]
												  + updateData["system.locations.mech.torso_c.armour.max"]
												  + updateData["system.locations.mech.head.armour.max"];
		}
		
		this.actor.update(updateData);
	}
	
	SetArmourWeight(event) {
		const element = event.currentTarget;
		const value = element.value;
		
		let updateData = {};
		let remainder = value - Math.floor(value);
		if(remainder != 0 && remainder != 0.5)
		{
			if(remainder < 0.5)
				updateData["system.armour.tonnage"] = Math.floor(value) + 0.5;
			else if(remainder > 0.5)
				updateData["system.armour.tonnage"] = Math.ceil(value);
		}
		else {
			updateData["system.armour.tonnage"] = parseFloat(value);
		}
		
		//Set up the max armour factor.
		let armourfactor = updateData["system.armour.tonnage"];
		armourfactor *= (this.actor.system.armour.type == "ff" ? 17.92 : 16);
		updateData["system.armour.armourfactor.max"] = Math.floor(armourfactor);
		
		this.actor.update(updateData);
	}
	
	async SetArmourAssigned(event) {
		const element = event.currentTarget;
		const which = element.id;
		const vehicleType = this.actor.system.type;
		let updateData = {};
		
		const oldValue = updateData["system.locations." + vehicleType + "." + which + ".armour.assigned"];
		const value = Math.min(which == "head" ? 9 : this.actor.system.locations[vehicleType][which.replace("rear","torso")].structure.max*2, parseInt(Math.round(element.value)));
		const diff = value - oldValue;
		
		updateData["system.locations." + vehicleType + "." + which + ".armour.assigned"] = value;
		updateData["system.locations." + vehicleType + "." + which + ".armour.value"] = value;
		updateData["system.armour.armourfactor.used"] = this.actor.system.armour.armourfactor.used + diff;
		
		if(["torso_c", "rear_c", "torso_l", "rear_l", "torso_r", "rear_r"].includes(which)) {
			const altWhich = which.includes("rear") ? which.replace("rear","torso") : which.replace("torso", "rear");
			const totalMax = this.actor.system.locations[vehicleType][which].structure.max * 2;
			const altMax = totalMax - value;
			updateData["system.locations." + vehicleType + "." + altWhich + ".armour.max"] = altMax;
			if(this.actor.system.locations[vehicleType][altWhich].armour.assigned > altMax)
				updateData["system.locations." + vehicleType + "." + altWhich + ".armour.assigned"] = altMax;
			updateData["system.locations." + vehicleType + "." + which + ".armour.max"] = totalMax - altMax;
		}
		
		await this.actor.update(updateData);
	}
	
	async QueryModifiers() {
		let modifiers = [];
		
		//console.warn(this.actor.system["mods"]["heat"]);
		//console.warn(this.actor.system["mods"]["movement"]);
		
		return modifiers;
	}
	
	HeatEffects() {
		const actorData = this.actor;
		const systemData = actorData.system;
		
		const heat = systemData.stats.heat;
		
		//Movement effect.
		let mp = 0;
		if(heat >= 5)
			mp++;
		if(heat >= 10)
			mp++;
		if(heat >= 15)
			mp++;
		if(heat >= 20)
			mp++;
		if(heat >= 25)
			mp++;
		const oldWalk = systemData.mp.walk;
		systemData.mp.walk = Math.max(1, oldWalk - mp);
		systemData.mp.run = Math.ceil(1.5 * systemData.mp.walk);
		
		//TN effect.
		let acc = 0;
		if(heat >= 8)
			acc++;
		if(heat >= 13)
			acc++;
		if(heat >= 17)
			acc++;
		if(heat >= 24)
			acc++;
		systemData.mods["gunnery"] = acc;
	}

	CalcFreeHeatSinks(rating) {
		let updateData = {};
		let free_sinks = Math.min(10, Math.floor(rating / 25));
		updateData["system.stats.free_heatsinks"] = free_sinks;
		this.actor.update(updateData);
		return free_sinks;
	}
	
	CalcCarriedWeight() {
		const actorData = this.actor;
		const systemData = actorData.system;
		let updateData = {};
		
		const cockpit_weight = parseFloat(systemData.stats.cockpit_type == "small" ? 2 : 3);
		const gyro_weight = systemData.engine.gyro_weight != undefined ? parseFloat(systemData.engine.gyro_weight) : 0;
		const engine_weight = systemData.engine.weight != undefined ? parseFloat(systemData.engine.weight) : 0;
		const structure_weight = systemData.armour.structure_weight != undefined ? parseFloat(systemData.armour.structure_weight) : 0;
		const armour_weight = systemData.armour.tonnage != undefined ? parseFloat(systemData.armour.tonnage) : 0;
		
		const weightOther = cockpit_weight + gyro_weight + engine_weight + structure_weight + armour_weight;
		updateData["system.weight.other"] = weightOther;
		
		let weightEquipment = 0;
		for(let i of this.actor.items) {
			weightEquipment += i.system.stats.tonnage;
		}
		updateData["system.weight.equipment"] = weightEquipment;
		
		this.actor.update(updateData);
	}

	ValidateBuild() {
		const systemData = this.actor.system;
		const otherWeight = systemData.weight.other;
		const equipmentWeight = systemData.weight.equipment;
	}

	/**
	* Handle clickable rolls.
	* @param {Event} event   The originating click event
	* @private
	*/
	_onRoll(event) {
		event.preventDefault();
		const ev = event;
		const element = event.currentTarget;
		const dataset = element.dataset;
		console.log("rollEvent: {0}", ev);
		
		const request = dataset.for;
		
		switch(dataset.rolltype) {
			case "skill":
				return this.RollSkill(request);
			case "vehicle_weapon":
				return this.RollAttack(dataset.id);
			case "critical":
				return this.RollCriticalSlot(request);
			default:
				console.error("RollType {0} was not recognised!", dataset.rolltype);
				return null;
		}
	}
	
	async RollSkill(which, target = null, modifiers = []) {
		if(which == undefined) {
			console.error("Expected a string skill name; got undefined");
			return;
		}
		
		const actorData = this.actor;
		const systemData = actorData.system;
		const rollData = actorData.getRollData();
		
		const hasPilot = systemData.pilot != undefined && systemData.pilot != "";
		const pilotData = game.actors.get(systemData.pilot);
		
		const skill = systemData.pilot_skills[which];
		const untrained = skill == -1;
		let tn = untrained ? (('piloting','gunnery','sensorops').includes(which) ? 18 : 12) : 8;
		
		//Special case for vehicles, there's some weirdness with the naming conventions that needs to be solved and it's easier to do it manually.
		let name = "";
		if(which == "gunnery" && systemData.type == "rail")
			name = "gunnery_turret";
		else if(which == "piloting" && (systemData.type == "ground" || systemData.type == "rail" || systemData.type == "sea"))
			name = "driving_" + systemData.type;
		else if(which == "piloting" || which == "gunnery")
			name = which + "_" + systemData.type;
		else if(which == "comms")
			name = "comms_conventional";
		else
			name = which;
		
		//NaturalAptitude calcs
		const neededTP = ('piloting','gunnery','sensorops','computers').includes(which) ? 5 : 3;
		let traitLevel = 0;
		if(hasPilot) {
			Object.entries(pilotData.system.traits).forEach(entry => {
				const trait = entry[1];
				const traitName = trait.name;
				const subtitle = trait.subtitle;
				const level = trait.level;
				
				if(traitName == "natural_aptitude") {
					let subname = subtitle.replace("/","_").replace("'","").replace(" ","_").toLowerCase();
					if(subname == name) {
						traitLevel = level >= traitLevel ? level : traitLevel;
					}
				}
			});
		}
		const hasNaturalAptitude = traitLevel >= neededTP;
		
		//Build the roll manually because we can't have nice things.
		let dice = {};
		let num = hasNaturalAptitude ? 3 : 2;
		let lowest = hasNaturalAptitude ? 7 : 0;
		let lowestIndex = 0;
		let total = 0;
		let sixes = 0;
		for(var i = 0; i < num; i++) {
			let roll = await new Roll('1d6', rollData).evaluate();
			const value = roll.dice[0].results[0].result;
			dice[i] = value;
			total += value;
				
			//Calculate the index and value of the lowest die roll
			if(value < lowest) {
				lowestIndex = i;
				lowest = value;
			}
			
			//If you get two 6s, it explodes and further 6s explode; ergo while you're on 2d6, a 12 explodes, but while you're on 3d6, an 18 (6+6+6) would explode.
			if(value == 6 && sixes < 5) {
				sixes++;
				console.log(sixes);
				if(sixes >= 2)
					num++;
			}
		}
		const isStunning = sixes >= 2;
		const isFumble = total == 2;
		
		//If the pilot has natural aptitude, drop the lowest die and record the value.
		if(hasNaturalAptitude)
			total -= dice[lowestIndex];
		else
			lowestIndex = -1;
		
		//Add skill or attribute bonus to the total.
		let linkMod = 0;
		total += untrained ? linkMod : skill;
		
		//Let modifiers kick in.
		//Populate modifiers with those applied to the systemData.
		for(var i = 0; i < Object.entries(systemData.mods).length; i++) {
			modifiers[Object.entries(modifiers).length] = Object.entries(systemData.mods)[i];
		}
		Object.entries(modifiers).forEach(entry => {
			let affected = entry[1][0];
			let modifier = entry[1][1];
			
			if(affected == which) {
				tn += parseInt(modifier);
			}
		});
		
		//Calculate the MoS/F:
		const margin = (total >= tn ? "+" : "") + (total - tn);
		const isSuccess = (total >= tn && !isFumble) || isStunning;
		
		//Get bio data for the target's pilot, if there's a target.
		let targetPilot = null;
		if(target == undefined)
			target = null;
		else
			targetPilot = game.actors.get(target.system.pilot);
		
		//Establish the message data.
		let msgData = {
			name: name,
			dice: dice,
			lowest: lowestIndex,
			rollMod: skill,
			speaker: (hasPilot ? pilotData.name : actorData.name),
			untrained: untrained,
			tn: tn,
			actionType: "SA",
			rollType: "skill",
			img: (hasPilot ? pilotData.img : actorData.img),
			baseSkill: "none",
			result: total,
			margin: (isFumble ? (total-tn > -10 ? "-10" : margin) : (isStunning ? (total-tn < 10 ? "+10" : margin) : margin)),
			isSuccess: isSuccess,
			successOrFail: (!isFumble && !isStunning ? (margin < 0 ? "Failed" : "Succeeded") : isStunning ? "Succeeded" : "Failed"),
			isFumble: isFumble,
			isStunning: isStunning,
			target: target,
			targetPilot: targetPilot
		}
		//Apply the chat roll mode.
		msgData = ChatMessage.applyRollMode(msgData, game.settings.get("core", "rollMode"));
		
		//Render the message and send it to the chat window.
		const render = await renderTemplate("systems/a-time-of-war/templates/chat/StatRoll.hbs", msgData);
		const msg = await ChatMessage.create({
			content: render,
			sound: CONFIG.sounds.dice,
			system: { "isSuccess": isSuccess }
		});
		
		return msg;
	}
	
	async RollAttack(weaponId, modifiers = []) {
		let weapon = null;
		if(weaponId == "lpunch" || weaponId == "rpunch" || weaponId == "kick") {
			weapon = {
				"system": {
					"firedThisTurn": false,
					"profile": {
						"damage": weaponId == "kick" ? Math.ceil(this.actor.system.tonnage / 5) : Math.ceil(this.actor.system.tonnage / 10),
						"heat": 0
					}
				}
			};
		}
		else {
			weapon = this.actor.items.get(weaponId);
			if(weapon == null || weapon == undefined) {
				console.error("Expected an attack weapon id or lpunch, rpunch, kick; got null or undefined");
				return;
			}
		}
		
		const targets = game.user.targets;
		const targetToken = targets ? targets.values().next().value : undefined;
		if(targetToken == null || targetToken == undefined) {
			console.error("TargetToken", targetToken, "is null or undefined!");
			ui.notifications.error("You must select a token to target in order to make an attack.");
			return;
		}
		const target = targetToken.actor;
		if(target == null || target == undefined) {
			console.error("Target", target, "is null or undefined!");
			ui.notifications.error("You must select a token to target in order to make an attack.");
			return;
		}
		
		let updateData = {};
		
		//some kind of attack type submenu goes here, at the end
		let msg = null;
		if((weaponId == "lpunch" || weaponId == "rpunch" || weaponId == "kick"))
			msg = await this.RollSkill("piloting", target);
		else
			msg = await this.RollSkill("gunnery", target);
		
		//Trigger weapon cooldown at end phase
		const attackIsLive = msg != null;
		if(attackIsLive)
		{
			updateData["system.firedThisTurn"] = true;
			weapon.system.firedThisTurn = true;
			weapon.update(updateData);
			
			//Apply self heat
			//this.actor.system.stats.heat += parseInt(weapon.system.profile.heat);
			updateData = {};
			console.warn(this.actor.system.stats);
			updateData["system.stats.heat"] = parseFloat(this.actor.system.stats.heat) + parseFloat(weapon.system.profile.heat);
			console.warn(this.actor.system.stats);
			this.actor.update(updateData);
			
			//Determine if you need to roll to shutdown, or if your armour cooks off.
			
			const hit = msg.system.isSuccess;
			if(hit) {
				let facing = "front";
				//Do some magic to work out the facing based on relative position of attacker and target.
				
				
				await target.TakeDamage(weapon.system.profile.damage, facing);
			}
		}
	}
}
