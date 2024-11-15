/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
	return loadTemplates([
		'systems/a-time-of-war/templates/actor/parts/PersonActorGameplayPC.hbs',
		'systems/a-time-of-war/templates/actor/parts/PersonActorGameplayNPC.hbs',
		//'systems/a-time-of-war/templates/actor/parts/PersonActorCharacter.hbs',
		'systems/a-time-of-war/templates/actor/parts/PersonActorEquipment.hbs',
		'systems/a-time-of-war/templates/actor/parts/PersonActorProgression.hbs',
		'systems/a-time-of-war/templates/actor/parts/PersonActorOptions.hbs',
		/*
		// Actor partials.
		'systems/a-time-of-war/templates/actor/parts/actor-features.hbs',
		'systems/a-time-of-war/templates/actor/parts/actor-items.hbs',
		'systems/a-time-of-war/templates/actor/parts/actor-spells.hbs',
		'systems/a-time-of-war/templates/actor/parts/actor-effects.hbs',
		// Item partials
		'systems/a-time-of-war/templates/item/parts/item-effects.hbs',
		*/
	]);
};
