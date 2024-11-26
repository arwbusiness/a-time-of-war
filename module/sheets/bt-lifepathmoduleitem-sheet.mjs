/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class BTLifepathModuleItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['bt', 'sheet', 'item', 'lifepath_module'],
      width: 500,
      height: 400,
      tabs: [
        /*{
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'features',
        },*/
      ],
    });
  }

	/** @override */
	get template() {
		return `systems/a-time-of-war/templates/item/LifepathModuleItemSheet.hbs`;
	}
	
	/** @override */
	async getData() {
		const context = super.getData();
		
		//Use a safe clone of the actor data for further operations from here.
		const itemData = this.document.toObject(false);
		const systemData = itemData.system;
		
		context.system = itemData.systemData;
		context.flags = itemData.flags;
		context.config = CONFIG.BT;
		
		this.PrepareDerivedData(itemData, systemData);
		
		return context;
	}
	
	PrepareDerivedData(itemData, systemData) {
		
	}
	
	/** @override */
	activateListeners(html) {
		super.activateListeners(html);
		
		html.on('click', '.rollable', this._onRoll.bind(this));
		
		html.on('change', '#module-type', this.ChangeModuleType.bind(this));
		
		this.SetSelectIndexes();
	}
	
	ChangeModuleType(event) {
		const element = event.currentTarget;
		const value = element.value;
		
		//Update the system
		let updateData = {};
		updateData["system.type"] = value;
		this.item.update(updateData);
	}
	
	SetSelectIndexes() {
		const systemData = this.item.system;
		
		//First, module-type
		let typeList = document.getElementById("module-type");
		switch(systemData.type) {
			case "affiliation":
				typeList.selectedIndex = 0;
				break;
			case "subaffiliation":
				typeList.selectedIndex = 1;
				break;
			case "early_childhood":
				typeList.selectedIndex = 2;
				break;
			case "late_childhood":
				typeList.selectedIndex = 3;
				break;
			case "schooling":
				typeList.selectedIndex = 4;
				break;
			case "adult_life":
				typeList.selectedIndex = 5;
				break;
			default:
				break;
		}
	}
	
	/* * * * */
	
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
	}
}
