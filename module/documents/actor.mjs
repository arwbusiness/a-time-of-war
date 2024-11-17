/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class BTActor extends Actor {
	/** @override */
	prepareData() {
		// Prepare data for the actor. Calling the super version of this executes
		// the following, in order: data reset (to clear active effects),
		// prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
		// prepareDerivedData().
		super.prepareData();
	}

	/** @override */
		prepareBaseData() {
		// Data modifications in this step occur before processing embedded
		// documents or derived data.
	}

	/**
	* @override
	* Augment the actor source data with additional dynamic data. Typically,
	* you'll want to handle most of your calculated/derived data in this step.
	* Data calculated in this step should generally not exist in template.json
	* (such as ability modifiers rather than ability scores) and should be
	* available both inside and outside of character sheets (such as if an actor
	* is queried and has a roll executed directly from it).
	*/
	prepareDerivedData() {
		const actorData = this;
		const systemData = actorData.system;
		const flags = actorData.flags.bt || {};

		// Make separate methods for each Actor type (character, npc, etc.) to keep
		// things organized.
		this._preparePcData(actorData);
		this._prepareNpcData(actorData);
		this._prepareVehicleData(actorData);
	}

	/**
	* Prepare Character type specific data
	*/
	_preparePcData(actorData) {
		if (actorData.type !== 'pc')
			return;
		
		const systemData = actorData.system;
		this.CalculateSkillLevels(actorData, systemData);
		
		console.log("TRYING TO ADD CUSTOM SKILL NOW");
		this.AddCustomSkill(systemData, "art", "painting", "dex", "");
		
		//systemData.skills.climbing.tn = Math.random()*10;
	}
	
	CalculateSkillLevels(actorData, systemData) {
		const skills = Object.entries(systemData.skills);
		const tieredSkills = ["computers", "martial_arts", "melee_weapons", "pickpocket", "sleightofhand", "quickdraw", "art", "interest"];
		const customSkills = ["art", "career", "interest", "language", "protocol", "science", "streetwise", "survival"];
		
		for(var i = 0; i <= skills.length; i++) {
			
			let name = skills[i][0];
			let data = Object.entries(skills[i][1]);
			if(data.length == 0) //Skip custom skill groups that are empty
				continue;
			
			const isCustomSkill = data[0][0] != "xp";
			if(isCustomSkill) {
				name = data[0][0];
				data = data[0][1];
			}
			else
				data = skills[i][1];
			
			//extract the elements for use
			const xp = data.xp;
			let mod = data.mod;
			let level = data.level;
			//const link = data.link;
			let tn = data.tn;
			let type = data.type;
			
			//What's the Link Modifier?
			console.log(data.link);
			let linkText = data.link.toString().split("+");
			const linkA = systemData.attributes[linkText[0]].mod;
			const linkB = linkText.length == 2 ? systemData.attributes[linkText[1]].mod : 0;
			const linkMod = linkA + linkB;
			
			//Calculate the Skill Level based on XP:
			level = this.CalcSL(xp);
			
			//Calculate the roll mod:
			mod = linkMod + level;
			
			//Uprate tiered skills.
			if(name in tieredSkills && level > 3) {
				tn++;
				type = type.substring(0,1)+"A";
			}
		}
	}
	
	AddCustomSkill(systemData, baseSkill, skillName, linkA, linkB) {
		console.log("REACHED CUSTOM SKILL CALL");
		const skill = {
			name: baseSkill + "/" + skillName,
			xp: 0,
			mod: 0,
			level: -1,
			link: linkA + linkB != "" ? "+" + linkB : "",
			tn: 7,
			type: "SB",
			custom: true
		}
		
		console.error(systemData.skills[baseSkill]);
		
		switch(baseSkill) {
			case "art":
				systemData.skills.art.push(skill);
				break;
			case "career":
				systemData.skills.career.push(skill);
				break;
			case "interest":
				systemData.skills.interest.push(skill);
				break;
			case "language":
				systemData.skills.language.push(skill);
				break;
			case "protocol":
				systemData.skills.protocol.push(skill);
				break;
			case "survival":
				systemData.skills.survival.push(skill);
				break;
			case "streetwise":
				systemData.skills.streetwise.push(skill);
				break;
			default:
				console.error("Base skill " + baseSkill + " not found!");
				return null;
		}
		
		console.log(systemData.skills.art);
	}
	
	CalcSL(xp) {
		if(xp >= 570)
			return 10;
		
		let sl = -1;
		let mult = 1;
		for(var l = 20; l <= 570; mult++) {
			if(xp <= l)
				break;
			else {
				l += (10*mult);
				sl++;
			}
		}
		
		return sl;
	}
	
	CalcXPForNextSL(xp) {
		if(xp >= 570)
			return 0;
		
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
	}

	/**
	* Prepare NPC type specific data.
	*/
	_prepareNpcData(actorData) {
		if (actorData.type !== 'npc')
			return;

		const systemData = actorData.system;

		//systemData.xp = systemData.cr * systemData.cr * 100;
	}

  /**
   * Prepare NPC type specific data.
   */
  _prepareVehicleData(actorData) {
    if (actorData.type !== 'vehicle') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;
    
	//systemData.xp = systemData.cr * systemData.cr * 100;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    // Starts off by populating the roll data with a shallow copy of `this.system`
    const data = { ...this.system };

    // Prepare character roll data.
    this._getPcRollData(data);
    this._getNpcRollData(data);
    this._getVehicleRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getPcRollData(data) {
    if (this.type !== 'pc') return;

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    /*if (data.abilities) {
      for (let [k, v] of Object.entries(data.abilities)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

    // Add level for easier access, or fall back to 0.
    if (data.attributes.level) {
      data.lvl = data.attributes.level.value ?? 0;
    }*/
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== 'npc') return;

    // Process additional NPC data here.
  }

  /**
   * Prepare Vehicle roll data.
   */
  _getVehicleRollData(data) {
    if (this.type !== 'vehicle') return;

    // Process additional Vehicle data here.
  }
}
