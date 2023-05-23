class UserManagerApp extends Application {
	constructor(options) {
		super(options);
		
		this.state = {};
		this.rendering = false;
	}

	update() {
		let users = game.users.filter((u) => u.character).map((u) => u.character.id);
		const folders = game.folders.filter((f) => f.type === 'Actor' && !f.flags['user-manager']?.exclude);

		let actors = [];
		folders.forEach((f) => { 
		    let cc = f.contents.filter((c) => (!c.isLoot && !c.name.startsWith('user') && c.hasPlayerOwner))
		    cc.forEach((c) => {
		            c.userGroup = f.name;
		            c.shortName = c.name.split(/\s/).shift();
		            actors.push(c);
		        });
		});
		actors = actors.filter((playerActor) => users.includes(playerActor.id));
		
		this.state = {
			actors: actors
		};
		let r = document.querySelector(":root");
		r.style.setProperty("--party-overview-min-width", '500px');
		r.style.setProperty("--party-overview-min-height", `${78 + 33 * actors.length}px`);
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			width: '500px',
			height: "fit-content",
			resizable: true,
			title: "User Manager",
			template: '/modules/user-manager/templates/user-manager.hbs',
			classes: ["user-manager-window", game.system.id],
			tabs: [
				{
					navSelector: ".tabs",
					contentSelector: ".content",
					initial: "general",
				},
			],
		});
	}

	getData() {
		this.update();
		return this.state;
	}

	// activateListeners(html) {
		// $(".btn-toggle-visibility").on("click", (event) => {
			// const actorId = event.currentTarget.dataset.actor;
			// this.hiddenActors = this.hiddenActors.includes(actorId) ? this.hiddenActors.filter((id) => id !== actorId) : [...this.hiddenActors, actorId];
			// game.settings.set("party-overview", "hiddenActors", this.hiddenActors);
			// this.render(false);
		// });
// 
		// super.activateListeners(html);
	// }

	render(force, options) {
		this.rendering = true;
		super.render(force, options);
	}

	close() {
		this.rendering = false;
		super.close();
	}
}


Hooks.once("init", () => {
	game.userManager = new UserManagerApp();

	return loadTemplates([
		"modules/user-manager/templates/parts/Tabs.html",
		"modules/user-manager/templates/parts/FilterButton.html",
		"modules/user-manager/templates/parts/ToggleVisibilityButton.html",
		"modules/user-manager/templates/parts/Languages.html",
		"modules/user-manager/templates/user-manager.hbs",
	]);
});


Hooks.on("renderActorDirectory", (app, html, data) => {
	if (!game.user.isGM) return;

	let button = $(
		`<button class="user-manager-button"><i class="fas fa-users"></i> User Manager</button>`
	);
	button.on("click", (e) => {
		game.userManager.render(true);
	});

	$(html).find(".footer-actions").prepend(button);
});

Handlebars.registerHelper("userManagerFolders", function () {
			return game.folders
				.filter((folder) => {
					return folder.type === 'Actor' && !folder.flags['user-manager']?.exclude;
				})
				.map((folder) => {
					return {
						folder.type,
						folder.name,
					};
				});
		});
