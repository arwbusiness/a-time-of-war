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
      width: 600,
      height: 600,
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
  async getData() {
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
      //this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
		this._prepareNPCData(context);
      //this._prepareItems(context);
    }

    // Enrich biography info for display
    // Enrichment turns text like `[[/r 1d20]]` into buttons
    context.enrichedBiography = await TextEditor.enrichHTML(
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
    );

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
  }

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

    // Render the item sheet for viewing/editing prior to the editable check.
    html.on('click', '.item-edit', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.on('click', '.item-create', this._onItemCreate.bind(this));

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

    // Rollable abilities.
    html.on('click', '.rollable', this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains('inventory-header')) return;
        li.setAttribute('draggable', true);
        li.addEventListener('dragstart', handler, false);
      });
    }
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
	
	GetLinkMod(linkText, systemData) {
		let link = 0;
		
		//Are there two linked attributes?
		if(linkText.length > 1) {
			let linkA = this.GetAttributeMod(systemData.attributes[linkText[0]].level);
			let linkB = this.GetAttributeMod(systemData.attributes[linkText[1]].level);
			link += linkA + linkB;
		}
		else {
			link += this.GetAttributeMod(systemData.attributes[linkText].level);
		}
		
		return link;
	}
	
	async RollAttribute(element, dataset, actorData, systemData, rollData) {
		//Figure out the link modifier.
		const linkText = dataset.link.split("+");
		const link = this.GetLinkMod(linkText, systemData);
		
		//Set the base TN
		let tn = 7;
		const twoAttributes = linkText.length > 1;
		if(twoAttributes) {
			tn = 18;
		}
		else {
			tn = 12;
		}
			
		const formula = "{2d6+" + link + "}cs>=" + tn;
		let roll = await new Roll(formula, rollData).evaluate();
		
		//This should round the (Total - TN / 2) down towards zero (if positive) and up towards zero (if negative)
		let margin = "+0";
		if(roll.total > tn) {
			margin = "+" + Math.ceil((roll.total - tn)/2);
		}
		else if(roll.total < tn) {
			margin = Math.floor((roll.total - tn)/2);
		}
		
		const results = roll.dice[0].results;
		console.log(roll.dice[0].results);
		
		const flavor = "Rolling " + dataset.label + ":";
		let msgData = {
			name: dataset.label,
			dice1: results[0].result,
			dice2: results[1].result,
			dice3: results[2] ? results[2].result : "",
			speaker: actorData.name,//ChatMessage.getSpeaker({ actor: actorData }),
			flavor: flavor,
			margin: margin,
			tn: tn,
			isSuccess: roll.total >= tn,
			successOrFail: margin < 0 ? "fail" : "success",
			rollType: "attribute"
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
		
		const skill = baseSkill == undefined ? systemData.skills[name] : systemData.skills[baseSkill][name];
		const link = skill.link;
		const tn = skill.tn;
		const level = skill.level;
		const actionType = skill.type;
		
		const formula = "{2d6+" + this.GetLinkMod(link.split("+"), systemData) + level + "}cs>=" + tn;
		let roll = await new Roll(formula, rollData).evaluate();
		
		//This should round the (Total - TN / 2) down towards zero (if positive) and up towards zero (if negative)
		let margin = "+0";
		if(roll.total > tn) {
			margin = "+" + Math.ceil((roll.total - tn)/2);
		}
		else if(roll.total < tn) {
			margin = Math.floor((roll.total - tn)/2);
		}
		
		const results = roll.dice[0].results;
		
		const flavor = "Rolling " + dataset.label + ":";
		let msgData = {
			name: dataset.label,
			dice1: results[0].result,
			dice2: results[1].result,
			dice3: results[2] ? results[2].result : "",
			speaker: actorData.name,//ChatMessage.getSpeaker({ actor: actorData }),
			flavor: flavor,
			margin: margin,
			tn: tn,
			isSuccess: roll.total >= tn,
			successOrFail: margin < 0 ? "fail" : "success",
			actionType: actionType,
			rollType: "skill"
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