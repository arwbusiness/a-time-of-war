import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class BTPersonActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['bt', 'sheet', 'actor', 'person'],
      width: 750,
      height: 650,
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
    const data = this.document.toObject(false);
    switch(data.type) {
	  case 'npc':
	    return `systems/a-time-of-war/templates/actor/PersonActorNPCSheet.hbs`;
	  case 'pc':
	  default:
	    return `systems/a-time-of-war/templates/actor/PersonActorPCSheet.hbs`;
	}
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.document.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Adding a pointer to CONFIG.BOILERPLATE
    context.config = CONFIG.BT;

    // Prepare character data and items.
    if (actorData.type == 'pc') {
		this._preparePCData(context);
      //this._prepareItems(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
		this._prepareNPCData(context);
      //this._prepareItems(context);
    }

    // Enrich biography info for display
    // Enrichment turns text like `[[/r 1d20]]` into buttons
    /*context.enrichedBiography = await TextEditor.enrichHTML(
      this.actor.system.biography,
      {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
        // Necessary in v11, can be removed in v12
        async: true,
        // Data to fill in for inline rolls
        rollData: this.actor.getRollData(),
        // Relative UUID resolution
        relativeTo: this.actor,
      }
    );*/

    // Prepare active effects
    /*context.effects = prepareActiveEffectCategories(
      // A generator that returns all effects stored on the actor
      // as well as any items
      this.actor.allApplicableEffects()
    );*/

    return context;
  }

	/**
	* Character-specific context modifications
	*
	* @param {object} context The context object to mutate
	*/
	_preparePCData(context) {
		// This is where you can enrich character-specific editor fields
		// or setup anything else that's specific to this type

		//this._prepareVariables(context);

		//Calc handlebars
		Handlebars.registerHelper('calcXPForNextSL', function(xp) {
			if(xp >= 570)
				return 0;
			
			let sl = -1;
			let mult = 1;
			for(var l = 20; l < 570; mult++) {
				if(xp < l)
					break;
				else {
					l += (10*mult);
					sl++;
				}
			}
			
			const remainder = l-xp;
			return remainder;
		});
		Handlebars.registerHelper('calcXPForNextTP', function(xp) {
			return 100-xp == 0 ? 100 : 100-xp;
		});
		
		//DERIVED DATA
		
	}
  
	//Prepare the stuff that isn't in template.json (usually because it's temporary or user-defined).
	/*_prepareVariables(context) {
		console.log("Preparing variables.");
		const systemData = context.system;
		
		if(systemData.traits == undefined)
			systemData.traits = {};
		if(systemData.advances == undefined)
			systemData.advances = {};
		
		//define advanceMaker
		if(systemData.advanceMaker == undefined) {
			systemData.advanceMaker = {
				type: "",
				name: "",
				xp: 0,
				free: false
			}
		}
	}*/

	/**
	* Character-specific context modifications
	*
	* @param {object} context The context object to mutate
	*/
	_prepareNPCData(context) {
		// This is where you can enrich character-specific editor fields
		// or setup anything else that's specific to this type
	}

  /**
   * Organize and classify Items for Actor sheets.
   *
   * @param {object} context The context object to mutate
   */
  _prepareItems(context) {
    // Initialize containers.
    /*const gear = [];
    const features = [];
    const spells = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: [],
    };

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;
      // Append to gear.
      if (i.type === 'item') {
        gear.push(i);
      }
      // Append to features.
      else if (i.type === 'feature') {
        features.push(i);
      }
      // Append to spells.
      else if (i.type === 'spell') {
        if (i.system.spellLevel != undefined) {
          spells[i.system.spellLevel].push(i);
        }
      }
    }

    // Assign and return
    context.gear = gear;
    context.features = features;
    context.spells = spells;*/
  }

  /* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		//Activate progression listeners
		this.listenForSheetButtons(html);

		// Render the item sheet for viewing/editing prior to the editable check.
		/*html.on('click', '.item-edit', (ev) => {
		  const li = $(ev.currentTarget).parents('.item');
		  const item = this.actor.items.get(li.data('itemId'));
		  item.sheet.render(true);
		});*/

		// -------------------------------------------------------------
		// Everything below here is only needed if the sheet is editable
		if (!this.isEditable) return;

		// Add Inventory Item
		/*html.on('click', '.item-create', this._onItemCreate.bind(this));

		// Delete Inventory Item
		html.on('click', '.item-delete', (ev) => {
		  const li = $(ev.currentTarget).parents('.item');
		  const item = this.actor.items.get(li.data('itemId'));
		  item.delete();
		  li.slideUp(200, () => this.render(false));
		});

		// Active Effect management
		html.on('click', '.effect-control', (ev) => {
		  const row = ev.currentTarget.closest('li');
		  const document =
			row.dataset.parentId === this.actor.id
			  ? this.actor
			  : this.actor.items.get(row.dataset.parentId);
		  onManageActiveEffect(ev, document);
		});

		// Drag events for macros.
		if (this.actor.isOwner) {
		  let handler = (ev) => this._onDragStart(ev);
		  html.find('li.item').each((i, li) => {
			if (li.classList.contains('inventory-header')) return;
			li.setAttribute('draggable', true);
			li.addEventListener('dragstart', handler, false);
		  });
		}*/
	}
	
	Update(updateData, ...keys) {
		this.actor.update(updateData);
		let systemData = this.getData().actor.system;
		let thing = systemData;
		for(var i = 0; i < keys.length; i++) {
			//console.log("Keys[i]: {0}", keys[i]);
			if(i < keys.length-1)
				thing = thing[keys[i]];
			else
				thing = updateData;
		}
		//console.log("Thing: {0}", thing);
		//console.log("systemData: {0}", systemData);
		this.RefreshSheet();
	}
	
	RefreshSheet() {
		this.document.prepareDerivedData();
		this.render();
	}

	//These listeners make the advance maker work.
	listenForSheetButtons(html) {
		// Rollable buttons.
		html.on('click', '.rollable', this._onRoll.bind(this));
		
		//Adding new skills and traits
		html.on('change', '.add-new-skill', this.AddNewSkill.bind(this));
		//html.on('change', '.add-new-trait', this.AddNewTrait.bind(this));
		
		//Bind the custom skill delete buttons.
		html.on('click', '.delete-custom-skill', this.DeleteCustomSkill.bind(this));
		
		//Bind the advance delete buttons.
		html.on('click', '.delete-advance', this.DeleteAdvance.bind(this));
		
		//Dual attribute roll button.
		html.on('click', '.dual-attribute-roll', this._onDualAttributeRollToggle.bind(this));
		document.getElementById("dual-attribute-roll").value = "";
		
		//Bind the advance creation sequence.
		html.on('click', '.advance-free', this._onAdvanceFreeToggle.bind(this));
		html.on('change','.advance-type', this._onAdvanceUpdate.bind(this));
		html.on('change','.advance-name', this._onAdvanceUpdate.bind(this));
		html.on('blur','.advance-xp', this._onAdvanceUpdate.bind(this));
		html.on('click', '.advance-finish', this._onAdvanceFinish.bind(this));
		document.getElementById("advance-name").value = "";
	}
	
	DeleteCustomSkill(event) {
		const element = event.currentTarget;
		const dataset = element.dataset;
		
		//split id="delete-survival-{{key}}" into 3 and assign the indexes
		const baseSkill = element.id.split("-")[1];
		const skillName = element.id.split("-")[2];
		
		//Make a dupe list and cleanse+update the real one.
		let skills = foundry.utils.duplicate(this.actor.system.skills[baseSkill]);
		let updateData = {};
		updateData["system.skills."+baseSkill] = [];
		this.actor.update(updateData);
		updateData = {};
		
		Object.entries(skills).forEach(skill => {
			console.log(skill);
			const data = skill[1];
			console.log(skill[0] + " " + skillName);
			if(skill[0] != skillName) {
				updateData["system.skills."+baseSkill+"."+skillName] = {
					xp: data.xp,
					mod: data.mod,
					level: data.level,
					link: data.link,
					tn: data.tn,
					type: data.type,
					baseSkill: baseSkill
				}
			}
		});
		
		this.actor.update(updateData);
	}
	
	AddNewSkill(event) {
		const element = event.currentTarget;
		const dataset = element.dataset;
		console.log(dataset);
		
		const actorData = this.getData().actor;
		const systemData = actorData.system;
		
		const baseSkill = dataset.baseskill;
		const newSkillName = element.value;
		const link = dataset.link;
		
		let updateData = {};
		updateData = {
			xp: 0,
			mod: this.GetLinkMod(link.split("+"), systemData),
			level: -1,
			link: link,
			tn: dataset.tn,
			type: dataset.type
		};
		console.log(updateData);
		
		element.value = "";
		
		this.actor.update({
			["system.skills."+baseSkill+"."+newSkillName]: updateData
		});
		this.render();
	}
	
	async DeleteAdvance(event) {
		const element = event.currentTarget;
		const dataset = element.dataset;
		
		const targetId = element.id;
		
		let advances = foundry.utils.duplicate(this.actor.system.advances);
		let updateData = {};
		updateData["system.advances"] = [];
		await this.actor.update(updateData);
		
		updateData = {};
		let i = 1;
		Object.entries(advances).forEach(entry => {
			console.log(entry);
			const data = entry[1];
			const type = data.type;
			const name = data.name;
			const xp = data.xp;
			const id = data.id;
			const free = data.free;
			const baseSkill = data.baseSkill;
			
			if(id != targetId) {
				updateData["system.advances."+id] = {
					type: type,
					name: name,
					xp: xp,
					id: ("advance-" + i++),
					baseSkill: baseSkill,
					free: free
				}
			}
		});
		
		await this.actor.update(updateData);
	}
	
	_onDualAttributeRollToggle(event) {
		const element = event.currentTarget;
		
		const dar = document.getElementById("dual-attribute-roll");
		if(element.checked) {
			dar.classList.remove("hidden");
			document.getElementById("dual-attribute-divider").classList.add("hidden");
		}
		else {
			dar.value = "";
			dar.classList.add("hidden");
			document.getElementById("dual-attribute-divider").classList.remove("hidden");
		}
	}
	
	//When you click the free XP toggle/checkbox, it calls this function.
	_onAdvanceFreeToggle(event) {
		const element = event.currentTarget;
		
		const actorData = this.getData().actor;
		const systemData = actorData.system;
		const advanceMaker = systemData.advanceMaker;
		
		advanceMaker.free = !advanceMaker.free;
	}
	
	async _onAdvanceUpdate(event) {
		const element = event.currentTarget;
		const id = element.id;
		let value = element.value;
		const updateTarget = "system.advanceMaker";
		
		console.log(value);
		
		let orig = ["1", "2", "3"];
		orig[0] = document.getElementById("advance-type").value;
		orig[1] = document.getElementById("advance-name").value;
		orig[2] = document.getElementById("advance-xp").value;
		orig[3] = document.getElementById("advance-free").checked;
		
		//const actorData = this.getData().actor;
		//const systemData = actorData.system;
		//const advanceMaker = systemData.advanceMaker;
		
		let updateData = {};
		switch(id.split('advance-')[1]) {
			case "type":
				updateData[updateTarget] = {
					type: value
				}
				//advanceMaker.type = value;
				break;
			case "name":
				if(value.includes('/'))
				{
					let baseSkill = value.split('/')[0];
					value = value.split('/')[1];
					updateData[updateTarget] = {
						baseSkill: baseSkill,
						name: value
					}
					//advanceMaker.baseSkill = baseSkill;
					//advanceMaker.name = value;
				}
				else {
					updateData[updateTarget] = {
						baseSkill: undefined,
						name: value
					}
					//advanceMaker.name = value;
				}
				break;
			case "xp":
				updateData[updateTarget] = {
					xp: parseInt(value)
				}
				//advanceMaker.xp = parseInt(value);
				break;
			default:
				break;
		}
		
		await this.actor.update(updateData);
		//document.getElementById(id).value = element.value;
		document.getElementById("advance-type").value = orig[0];
		document.getElementById("advance-name").value = orig[1];
		document.getElementById("advance-xp").value = parseInt(orig[2]);
		document.getElementById("advance-free").checked = orig[3];
	}
	
	//When you click the submit button on the advance maker, it calls this function.
	_onAdvanceFinish(event) {
		const actorData = this.getData().actor;
		const systemData = actorData.system;
		const advanceMaker = systemData.advanceMaker;
		let id = "advance-";
		let i = 1;
		const advances = Object.entries(systemData.advances);
		i += advances.length;
		
		//Name validation
		const allowedAttributes = ["str", "bod", "dex", "rfl", "wil", "int", "cha", "edg"];
		if(advanceMaker.type == "attribute")
		{
			let name = advanceMaker.name;
			console.log(name);
			if(!allowedAttributes.includes(name)) {
				console.error("{0} is not a valid attribute", name);
				return;
			}
		}
		
		//XP input validation
		if(!parseInt(advanceMaker.xp) || advanceMaker.xp == "" || advanceMaker.xp == undefined || advanceMaker.xp == null) {
			console.error("XP {0} didn't parse correctly or was blank!", advanceMaker.xp);
			return;
		}
		
		//Make an advance schema with an appropriate name and fill it with the data from the advance maker
		let updateData = {};
		updateData["system.advances."+id+i] = {
			name: advanceMaker.name,
			type: advanceMaker.type,
			xp: advanceMaker.xp,
			free: advanceMaker.free,
			id: id+i,
			baseSkill: advanceMaker.baseSkill
		};
		
		//Reset the advance maker
		updateData["system.advanceMaker"] = {
			type: "attribute",
			name: "",
			xp: "",
			free: false,
			id: "",
			baseSkill: undefined
		}
		
		this.actor.update(updateData);
		this.render();
	}

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data,
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system['type'];

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }

	/**
	* Handle clickable rolls.
	* @param {Event} event   The originating click event
	* @private
	*/
	_onRoll(event) {
		event.preventDefault();
		console.log("HEY");
		const element = event.currentTarget;
		const dataset = element.dataset;

		const actorData = this.actor;
		const systemData = actorData.system;
		const rollData = actorData.getRollData();
		const rollType = dataset.rolltype;
		
		switch(rollType) {
			case "attribute":
				return this.RollAttribute(element, dataset, actorData, systemData, rollData);
			case "skill":
				return this.RollSkill(element, dataset, actorData, systemData, rollData);
			default:
				console.error("RollType " + rollType + " not recognised!");
				return null;
		}
	}
	
	GetLinkMod(linkText, systemData, level = false) {
		let link = 0;
		
		//Are there two linked attributes?
		if(linkText.length > 1) {
			let linkA = !level ? this.GetAttributeMod(systemData.attributes[linkText[0]].level) : systemData.attributes[linkText[0]].level;
			let linkB = !level ? this.GetAttributeMod(systemData.attributes[linkText[1]].level) : systemData.attributes[linkText[1]].level;
			link += linkA + linkB;
		}
		else {
			link += !level ? this.GetAttributeMod(systemData.attributes[linkText].level) : systemData.attributes[linkText].level;
		}
		
		return link;
	}
	
	GetAttributeMod(level) {
		if(level == 0)
			return -4;
		else if(level == 1)
			return -2;
		else if(level == 2 || level == 3)
			return -1;
		else if(level >= 4 && level <= 6)
			return 0;
		else if(level >= 7 && level <= 9)
			return 1;
		else if(level == 10)
			return 2;
		else if(level >= 11) //Attribute/3 rounding down, max +5
			return Math.min(5, Math.floor(level/3));
	}
	
	async RollAttribute(element, dataset, actorData, systemData, rollData) {
		//Figure out the link modifier.
		let linkText = dataset.link.split("+");
		
		//Is it a dual attribute roll?
		let name = dataset.label;
		const dar = document.getElementById("dual-attribute-roll");
		if(!dar.classList.contains("hidden")) {
			linkText = (dar.value + dataset.link).split("+");
			name = dar.value.toUpperCase() + dataset.link.toUpperCase();
		}
		
		dar.value = "";
		dar.classList.add("hidden");
		document.getElementById("dual-attribute-divider").classList.remove("hidden");
		document.getElementsByClassName("dual-attribute-roll")[0].checked = false;
		
		const link = this.GetLinkMod(linkText, systemData, true);
		
		//Set the base TN
		let tn = 7;
		const twoAttributes = linkText.length > 1;
		if(twoAttributes)
			tn = 18;
		else
			tn = 12;
			
		const formula = "{2d6+" + link + "}cs>=" + tn;
		let roll = await new Roll(formula, rollData).evaluate();
		
		const results = roll.dice[0].results;
		const dice1 = results[0].result;
		const dice2 = results[1].result;
		const dice3 = results[2] != null && results[2] != undefined ? results[2].result : "";
		const droppedDie = Math.min(dice1,dice2,dice3) == dice1 ? 1 : Math.min(dice2,dice3) ? 2 : 3;
		
		const total = (dice3 ? dice1+dice2+dice3-Math.min(dice1,dice2,dice3) : dice1+dice2)+link;
		
		//This should round the (Total - TN / 2) down towards zero (if positive) and up towards zero (if negative)
		const margin = (total >= tn ? "+" : "") + (total - tn);
		
		let label = dataset.label;
		if(twoAttributes)
			label = linkText[0].toUpperCase() + "+" + linkText[1].toUpperCase();
		//const flavor = "Rolling " + name + ":";
		let msgData = {
			name: label,
			dice1: dice1,
			dice2: dice2,
			dice3: dice3,
			droppedDie: droppedDie,
			rollMod: link == 0 ? "+0" : link,
			speaker: actorData.name,
			//flavor: flavor,
			margin: margin,
			tn: tn,
			isSuccess: roll.total >= tn,
			successOrFail: margin < 0 ? "fail" : "success",
			rollType: "attribute",
			result: total,
			img: actorData.img
		};
		msgData = ChatMessage.applyRollMode(msgData, game.settings.get("core", "rollMode"));
		
		const render = await renderTemplate("systems/a-time-of-war/templates/roll/roll.hbs", msgData);
		const msg = await ChatMessage.create({
			content: render,
			sound: CONFIG.sounds.dice
		});
		
		return msg;
	}
	
	async RollSkill(element, dataset, actorData, systemData, rollData) {
		const name = dataset.label;
		const baseSkill = dataset.baseskill;
		console.log("TRYING TO ROLL SKILL {0}", name);
		
		const skill = baseSkill == undefined ? systemData.skills[name] : systemData.skills[baseSkill][name];
		const level = skill.level;
		const isTrained = level > -1;
		const link = skill.link;
		const tn = isTrained ? skill.tn : (link.toString().includes("+") ? 18 : 12);
		const actionType = skill.type;
		
		const rollMod = this.GetLinkMod(link.split("+"), systemData, !isTrained) + (isTrained ? level : 0);
		const formula = "{2d6+" + rollMod + "}cs>=" + tn;
		console.log(formula);
		let roll = await new Roll(formula, rollData).evaluate();
		
		const results = roll.dice[0].results;
		const dice1 = results[0].result;
		const dice2 = results[1].result;
		const dice3 = results[2] != null && results[2] != undefined ? results[2].result : "";
		const droppedDie = Math.min(dice1,dice2,dice3) == dice1 ? 1 : Math.min(dice2,dice3) ? 2 : 3;
		
		const total = (dice3 ? dice1+dice2+dice3-Math.min(dice1,dice2,dice3) : dice1+dice2) + rollMod;
		//keeps highest 2 by default but there's probably a negative trait that makes you roll 3 keep the two lowest, so I should account for that.
		
		//This should round the (Total - TN / 2) down towards zero (if positive) and up towards zero (if negative)
		const margin = (total >= tn ? "+" : "") + (total - tn);
		
		//const flavor = "Rolling {{{localize " + (baseSkill == undefined ? dataset.label + "}}}" : baseSkill + "}}/" + dataset.label) + (!isTrained ? " (Untrained)" : "") + ":";
		
		let msgData = {
			name: dataset.label,
			dice1: results[0].result,
			dice2: results[1].result,
			dice3: results[2] ? results[2].result : "",
			droppedDie: droppedDie,
			rollMod: rollMod == 0 ? "+0" : rollMod,
			speaker: actorData.name,
			//flavor: flavor,
			untrained: level == -1,
			margin: margin,
			tn: tn,
			isSuccess: roll.total >= tn,
			successOrFail: margin < 0 ? "FAILED" : "SUCCESS",
			actionType: actionType,
			rollType: "skill",
			result: total,
			img: actorData.img,
			baseSkill: baseSkill == undefined ? "none" : baseSkill
		};
		msgData = ChatMessage.applyRollMode(msgData, game.settings.get("core", "rollMode"));
		
		const render = await renderTemplate("systems/a-time-of-war/templates/roll/roll.hbs", msgData);
		const msg = await ChatMessage.create({
			content: render,
			sound: CONFIG.sounds.dice
		});
		
		return msg;
	}
}