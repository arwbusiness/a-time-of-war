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
		
		//Reset skills by setting their XP to 0.
		const skills = Object.entries(systemData.skills);
		skills.forEach(skill => {
			let name = skill[0];
			let data = Object.entries(skill[1]);
			if(data.length == 0)
				return;
			
			const isCustomSkill = data[0][0] != "xp";
			if(isCustomSkill) {
				name = data[0][0];
				data = data[0][1];
			}
			else
				data = skill[1];
			
			data.xp = 0;
		});
		
		//Reset attributes by setting their XP to 0.
		const attributes = Object.entries(systemData.attributes);
		attributes.forEach(attribute => {
			attribute[1].xp = 0;
		});
		
		//Reset traits by setting their XP to 0.
		const traits = Object.entries(systemData.traits);
		traits.forEach(trait => {
			trait[1].xp = 0;
		});
		
		//Reset spent XP counter.
		systemData.xp_spent = 0;
		
		//Increase the XP of everything on the sheet using the xp from saved advances.
		const customSkills = ["art", "career", "interest", "language", "protocol", "science", "streetwise", "survival"];
		Object.entries(systemData.advances).forEach(advance => {
			const data = advance[1];
			const xp = parseInt(data.xp);
			const type = data.type;
			const name = data.name;
			const traitId = data.traitId;
			const baseSkill = data.baseSkill;
			
			if(type == "attribute") {
				systemData.attributes[name].xp += xp;
			}
			
			if(type == "skill") {
				//console.log("baseSkill: {0}, name: {1}", baseSkill, name);
				if(baseSkill == undefined || baseSkill == "") {
					systemData.skills[name].xp += xp;
				}
				else if (customSkills.includes(baseSkill)) {
					console.log(systemData.skills);
					console.log("your baseSkill: {0}", systemData.skills[baseSkill]);
					systemData.skills[baseSkill][name].xp += xp;
				}
				else {
					console.error("baseSkill: {0} not recognised!", baseSkill);
				}
			}
			
			if(type == "trait") {
				systemData.traits[traitId].xp += xp;
			}
			
			systemData.xp_spent += data.free ? 0 : xp;
		});
		
		//Special case for Age modifiers
		const age = systemData.details.age;
		//Make an ageXP object to hold the age modifiers
		let ageXp = {
			str: 0,
			bod: 0,
			dex: 0,
			rfl: 0,
			wil: 0,
			int: 0,
			cha: 0
		};
		
		//Calculate the age modifiers
		if (age >= 25 && age < 31)
		{
			ageXp.str = 100;
			ageXp.bod = 100;
			ageXp.dex = 0;
			ageXp.rfl = 100;
			ageXp.wil = 100;
			ageXp["int"] = 100;
			ageXp.cha = 50;
		}
		else if (age >= 31 && age < 41)
		{
			ageXp.str = 200;
			ageXp.bod = 200;
			ageXp.dex = 0;
			ageXp.rfl = 0;
			ageXp.wil = 200;
			ageXp["int"] = 200;
			ageXp.cha = 50;
		}
		else if (age >= 41 && age < 51)
		{
			ageXp.str = 200;
			ageXp.bod = 200;
			ageXp.dex = -50;
			ageXp.rfl = 0;
			ageXp.wil = 250;
			ageXp["int"] = 0;
			ageXp.cha = 25;
		}
		else if (age >= 51 && age < 61)
		{
			ageXp.str = 200;
			ageXp.bod = 100;
			ageXp.dex = -50;
			ageXp.rfl = -100;
			ageXp.wil = 250;
			ageXp["int"] = 0;
			ageXp.cha = -25;
		}
		else if (age >= 61 && age < 71)
		{
			ageXp.str = 100;
			ageXp.bod = 0;
			ageXp.dex = -150;
			ageXp.rfl = -100;
			ageXp.wil = 250;
			ageXp["int"] = 0;
			ageXp.cha = -75;
		}
		else if (age >= 71 && age < 81)
		{
			ageXp.str = 0;
			ageXp.bod = -125;
			ageXp.dex = -150;
			ageXp.rfl = -200;
			ageXp.wil = 200;
			ageXp["int"] = 0;
			ageXp.cha = -150;
		}
		else if (age >= 81 && age < 91)
		{
			ageXp.str = -150;
			ageXp.bod = -275;
			ageXp.dex = -250;
			ageXp.rfl = -300;
			ageXp.wil = 150;
			ageXp["int"] = 0;
			ageXp.cha = -250;
		}
		else if (age >= 91 && age < 101)
		{
			ageXp.str = -300;
			ageXp.bod = -450;
			ageXp.dex = -400;
			ageXp.rfl = -425;
			ageXp.wil = 50;
			ageXp["int"] = 0;
			ageXp.cha = -350;
		}
		else if (age >= 101)
		{
			ageXp.str = -500;
			ageXp.bod = -650;
			ageXp.dex = -600;
			ageXp.rfl = -575;
			ageXp.wil = -50;
			ageXp["int"] = -200;
			ageXp.cha = -500;
		}
		
		//Ok, add the age XP now.
		systemData.attributes["str"].xp += ageXp.str;
		systemData.attributes["bod"].xp += ageXp.bod;
		systemData.attributes["dex"].xp += ageXp.dex;
		systemData.attributes["rfl"].xp += ageXp.rfl;
		systemData.attributes["wil"].xp += ageXp.wil;
		systemData.attributes["int"].xp += ageXp["int"];
		systemData.attributes["cha"].xp += ageXp.cha;
		
		//Ok, let's get the XP modifiers from 
		let moduleXP = 0;
		/*Object.entries(systemData.lifepath.modules).forEach(entry => {
			const module = entry[1].system;
			const a = module.attributes;
			const t = module.traits;
			const s = module.skills;
			moduleXP += module.cost;
			
			Object.entries(a).forEach(att => {
				const name = att[0];
				const value = att[1];
				systemData.attributes[name].xp += value;
			});
			Object.entries(t).forEach(trt => {
				const name = trt[0];
				const value = trt[1];
				systemData.traits[name].xp += value;
				
				//the traits will need to actually be added to the sheet, you know?
			});
			Object.entries(s).forEach(skl => {
				const name = skl[0];
				const value = skl[1];
				systemData.skills[name].xp += value;
				
				//custom skills will need to be added to the sheet too! This could be harder than you though...
			});
		});*/
		systemData.xp_spent += moduleXP;
				
		//special case for primary language
		const lang_primary = systemData.details.lang_primary;
		if(lang_primary != undefined && lang_primary != "")
			systemData.skills["language"][lang_primary].xp = 570;
		
		//Ok, get the levels!
		this.CalculateAttributeLevels(systemData);
		this.CalculateSkillLevels(systemData);
		this.CalculateTraitLevels(systemData);
		
		//Derived values!
		let hasToughness = false;
		let hasFit = false;
		Object.entries(systemData.traits).forEach(entry => {
			const trait = entry[1];
			
			if(trait.name == "Fit" && trait.level >= 2)
				hasFit = true;
			else if(trait.name == "Toughness" && trait.level >= 3)
				hasToughness = true;
			
			if(hasFit && hasToughness)
				return;
		});
		systemData.damage.max = Math.max(1, systemData.attributes.bod.level * 2 * (hasToughness ? 2 : 1));
		systemData.fatigue.max = Math.max(1, systemData.attributes.wil.level * 2 * (hasFit ? 2 : 1));
		systemData.luck.max = systemData.attributes.edg.level;
		
		//MP will be here somewhere. Will do it in a moment.
		systemData.mp.walk = Math.max(1, systemData.attributes.str.level + systemData.attributes.rfl.level);
		systemData.mp.run = Math.max(1, 10 + systemData.attributes.str.level + systemData.attributes.rfl.level + Math.max(0,systemData.skills.running.level));
		systemData.mp.sprint = Math.max(1, systemData.mp.run * 2);
		systemData.mp.climb = Math.max(1, Math.ceil(systemData.mp.walk/2)+Math.max(0,systemData.skills.climbing) / (systemData.skills.climbing.level == -1 ? 2 : 1));
		systemData.mp.crawl = Math.max(1, Math.ceil(systemData.mp.walk/4));
		systemData.mp.swim = Math.max(1, systemData.mp.walk + Math.max(0,systemData.skills.swimming.level) / (systemData.skills.swimming.level == -1 ? 2 : 1));
		
		//Don't forget to add a theoretical encumbrance.
		
		this.render();
	}
	
	CalculateAttributeLevels(systemData) {
		const attributes = systemData.attributes;
		
		let updateData = {};
		let list = Object.entries(attributes);
		list.forEach(att => {
			const attribute = att[1];
			attribute.level = this.CalcTP(attribute.xp);
			//age modifier
			attribute.mod = this.GetAttributeMod(attribute.level);
			updateData["system.attributes."+att[0]] = attribute;
		});
		
		this.update(updateData);
	}
	
	CalculateTraitLevels(systemData) {
		const traits = systemData.traits;
		
		let updateData = {};
		let list = Object.entries(traits);
		list.forEach(tr => {
			const trait = tr[1];
			trait.level = this.CalcTP(trait.xp);
			updateData["system.traits."+tr[0]] = trait;
		});
		
		this.update(updateData);
	}
	
	CalculateSkillLevels(systemData) {
		const tieredSkills = ["computers", "martial_arts", "melee_weapons", "pickpocket", "sleightofhand", "quickdraw", "art", "interest"];
		const customSkills = ["art", "career", "interest", "language", "protocol", "science", "streetwise", "survival"];
		
		const skills = systemData.skills;
		
		let updateData = {};
		let list = Object.entries(skills);
		list.forEach(skill => {
			let data = skill[1];
			
			let isCustomSkill = false;
			if(customSkills.includes(skill[0])) {
				isCustomSkill = true;
				Object.entries(data).forEach(customSkill => {
					let newData = customSkill[1];
					if(newData.link == undefined)
						return;
					newData.level = this.CalcSL(newData.xp);
					let linkText = newData.link.split("+");
					const linkA = systemData.attributes[linkText[0]].mod;
					const linkB = linkText.length == 2 ? systemData.attributes[linkText[1]].mod : 0;
					const linkMod = linkA + linkB;
					newData.mod = newData.level + linkMod;
					updateData["system.skills."+skill[0]+"."+customSkill[0]] = newData;
				});
			}
			else {
				data.level = this.CalcSL(data.xp);
				let linkText = data.link.split("+");
				const linkA = systemData.attributes[linkText[0]].mod;
				const linkB = linkText.length == 2 ? systemData.attributes[linkText[1]].mod : 0;
				const linkMod = linkA + linkB;
				data.mod = data.level + linkMod;
				updateData["system.skills."+skill[0]] = data;
			}
		});
		
		this.update(updateData);
	}
	
	CalculateAgeModifiers() {
		const systemData = this.system;
		systemData.calcAge = false;
		if(systemData.attributes == undefined || systemData.attributes.str == undefined)
				return;
			
		const age = systemData.details.age;
		systemData.attributes.str.xp == undefined ? 0 : systemData.attributes.str.xp;
		systemData.attributes.bod.xp == undefined ? 0 : systemData.attributes.bod.xp;
		systemData.attributes.dex.xp == undefined ? 0 : systemData.attributes.dex.xp;
		systemData.attributes.rfl.xp == undefined ? 0 : systemData.attributes.rfl.xp;
		systemData.attributes.wil.xp == undefined ? 0 : systemData.attributes.wil.xp;
		systemData.attributes.int.xp == undefined ? 0 : systemData.attributes.int.xp;
		systemData.attributes.cha.xp == undefined ? 0 : systemData.attributes.cha.xp;
		systemData.attributes.edg.xp == undefined ? 0 : systemData.attributes.edg.xp;
		
		if(age >= 25 && age < 31) {
			systemData.attributes.str.xp += 100;
			systemData.attributes.bod.xp += 100;
			systemData.attributes.rfl.xp += 100;
			systemData.attributes.int.xp += 100;
			systemData.attributes.wil.xp += 100;
			systemData.attributes.cha.xp += 50;
		}
		else if(age >= 31 && age < 41) {
			systemData.attributes.str.xp += 100;
			systemData.attributes.bod.xp += 100;
			systemData.attributes.rfl.xp -= 100;
			systemData.attributes.int.xp += 100;
			systemData.attributes.wil.xp += 100;
		}
		else if(age >= 41 && age < 51) {
			systemData.attributes.dex.xp -= 50;
			systemData.attributes.cha.xp -= 25;
		}
		else if(age >= 51 && age < 61) {
			systemData.attributes.bod.xp -= 100;
			systemData.attributes.rfl.xp -= 100;
			systemData.attributes.cha.xp -= 50;
		}
		else if(age >= 61 && age < 71) {
			systemData.attributes.str.xp -= 100;
			systemData.attributes.bod.xp -= 100;
			systemData.attributes.dex.xp -= 100;
			systemData.attributes.int.xp += 50;
			systemData.attributes.cha.xp -= 50;
		}
		else if(age >= 71 && age < 81) {
			systemData.attributes.str.xp -= 100;
			systemData.attributes.bod.xp -= 125;
			systemData.attributes.rfl.xp -= 100;
			systemData.attributes.int.xp -= 50;
			systemData.attributes.cha.xp -= 75;
		}
		else if(age >= 81 && age < 91) {
			systemData.attributes.str.xp -= 150;
			systemData.attributes.bod.xp -= 150;
			systemData.attributes.dex.xp -= 100;
			systemData.attributes.rfl.xp -= 100;
			systemData.attributes.wil.xp -= 100;
			systemData.attributes.int.xp -= 50;
			systemData.attributes.cha.xp -= 100;
		}
		else if(age >= 91 && age < 101) {
			systemData.attributes.str.xp -= 150;
			systemData.attributes.bod.xp -= 175;
			systemData.attributes.dex.xp -= 150;
			systemData.attributes.rfl.xp -= 125;
			systemData.attributes.wil.xp -= 150;
			systemData.attributes.int.xp -= 100;
			systemData.attributes.cha.xp -= 100;
		}
		else if(age >= 101) {
			systemData.attributes.str.xp -= 200;
			systemData.attributes.bod.xp -= 200;
			systemData.attributes.dex.xp -= 200;
			systemData.attributes.rfl.xp -= 150;
			systemData.attributes.wil.xp -= 200;
			systemData.attributes.int.xp -= 100;
			systemData.attributes.cha.xp -= 150;
		}
	}
	
	AddCustomSkill(systemData, baseSkill, skillName, linkA, linkB) {
		const skills = Object.entries(systemData.skills);
		const skill = {
				xp: 0,
				mod: 0,
				level: -1,
				link: linkA + (linkB != "" ? ("+" + linkB) : ""),
				tn: 7,
				type: "SB"
		}
		systemData.skills[baseSkill][skillName] = skill;
	}
	
	CreateAdvance(systemData, name, type, xp, free = false) {
		systemData.advances["name"] = {
			name: name,
			type: type,
			xp: xp,
			free: free
		};
	}
	
	CalcTP(xp) {
		return xp >= 0 ? Math.floor(xp/100) : Math.ceil(xp/100);
	}
	
	CalcSL(xp) {
		if(xp >= 570)
			return 10;
		
		let sl = -1;
		let mult = 1;
		for(var l = 20; l <= 570; mult++) {
			if(xp >= l)
			{
				l += (10*mult);
				sl++;
			}
			else {
				break;
			}
		}
		
		return sl;
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
		if (actorData.type !== 'vehicle')
			return;

		const systemData = actorData.system;
		const flags = actorData.flags.bt || {};
	}

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    // Starts off by populating the roll data with a shallow copy of `this.system`
    const data = { ...this.system };

    // Prepare character roll data.
    this._getPCRollData(data);
    this._getNPCRollData(data);
    this._getVehicleRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getPCRollData(data) {
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
  _getNPCRollData(data) {
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
