import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class BTVehicleItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['bt', 'sheet', 'item'],
      width: 520,
      height: 480,
      tabs: [
        /*{
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'description',
        },*/
      ],
    });
  }

	/** @override */
	get template() {
		const path = 'systems/a-time-of-war/templates/item';
		// Return a single sheet for all item types.
		return `${path}/VehicleItemSheet.hbs`;

		// Alternatively, you could use the following return statement to do a
		// unique item sheet by type, like `weapon-sheet.hbs`.
		//return `${path}/bt-${this.item.type}-sheet.hbs`;
	}

	/* -------------------------------------------- */

	/** @override */
	async getData() {
		// Retrieve base data structure.
		const context = super.getData();

		// Use a safe clone of the item data for further operations.
		const actorData = this.document.toObject(false);

		// Enrich description info for display
		// Enrichment turns text like `[[/r 1d20]]` into buttons
		//It's name-linked (context.<name>) to the sheet (editor <name>, etc)
		context.enrichedDescription = await TextEditor.enrichHTML(
			this.item.system.description,
			{
				// Whether to show secret blocks in the finished html
				secrets: this.document.isOwner,
				// Necessary in v11, can be removed in v12
				async: true,
				// Data to fill in for inline rolls
				rollData: this.item.getRollData(),
				// Relative UUID resolution
				relativeTo: this.item,
			}
		);

		if(actorData.type == 'vehicle_weapon')
		{
			
		}
		else if(actorData.type == 'vehicle_equipment')
		{
			
		}

		// Add the item's data to context.data for easier access, as well as flags.
		context.system = actorData.system;
		context.flags = actorData.flags;

		// Adding a pointer to CONFIG.BOILERPLATE
		context.config = CONFIG.BT;

		// Prepare active effects for easier access
		context.effects = prepareActiveEffectCategories(this.item.effects);

		return context;
	}

	/* -------------------------------------------- */

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// Everything below here is only needed if the sheet is editable
		if (!this.isEditable) return;

		this.ActivateSheetListeners(html);

		// Roll handlers, click handlers, etc. would go here.

		// Active Effect management
		/*html.on('click', '.effect-control', (ev) =>
		  onManageActiveEffect(ev, this.item)
		);*/
	}
	
	ActivateSheetListeners(html) {
		html.on('blur', '#description', this.ChangeTextArea.bind(this));
		html.on('change', '#per-tonnage', this.ChangePerTonnage.bind(this));
	}
	
	ChangeTextArea(event) {
		const element = event.currentTarget;
		const id = element.id;
		const value = element.value;
		
		let updateData = {};
		updateData["system." + id] = value;
		this.item.update(updateData);
		//No need to re-render.
	}
	
	async ChangePerTonnage(event) {
		event.preventDefault();
		
		const element = event.currentTarget;
		const value = element.checked;
		
		let updateData = {};
		updateData["system.per_tonnage"] = value;
		await this.item.update(updateData);
	}
}