import UserManagerApp from "./module/logic.js";


Hooks.once("init", () => {
	game.userManager = new UserManagerApp();

	return loadTemplates([
		"modules/user-manager/templates/parts/Tabs.html",
		"modules/user-manager/templates/parts/FilterButton.html",
		"modules/user-manager/templates/parts/ToggleVisibilityButton.html",
		"modules/user-manager/templates/actors.hbs",
	]);
});

Hooks.on("ready", () => {
	if (!game.userManager) game.userManager = new UserManagerApp();

	Handlebars.registerHelper("userManagerFolders", function () {
				let actors = game.userManager.getData();
				return actors
			});

	const tabs = {
			active: { id: "active", visible: true, label: 'Active' },
			archive: { id: "archive", visible: true, label: 'Archive' },
			 };
});

Hooks.on("renderActorDirectory", (app, html, data) => {
	if (!game.user.isGM) return;

	let button = $(
		`<button class="user-manager-button"><i class="fas fa-users"></i> User Manager</button>`
	);
	button.on("click", (e) => {
		game.userManager.render(true);
	});

	$(html).find(".directory-footer").prepend(button);
});


