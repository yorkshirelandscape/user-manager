class UserManagerApp extends Application {
	constructor(options) {
		super(options);
		
		this.state = {};
		this.activeTab = "active";
		this.rendering = false;
	}

	update() {
		let userList = game.users.filter((u) => u.character).map((u) => ( { id: u.id, name: u.name, character: u.character.id } ) );
		const folders = game.folders.filter((f) => f.type === 'Actor');

		let actors = [];
		folders.forEach((f) => { 
		    let characters = f.contents.filter((c) => (!c.isLoot && !c.name.startsWith('user') && c.hasPlayerOwner))
		    characters.forEach((c) => {
	            c.userGroup = { id: f.id, name: f.name };
	            c.shortName = c.name.split(/\s/).shift();
	            let owner = userList.find((u) => u.character === c.id )
				if (!owner) {
					owner = userList.find((u) => c.getUserLevel(u) === 3);	
				}
				if (owner) {
		            c.owner = { id: owner.id, name: owner.name };					
				}
	        	actors.push(c);
	        });
		});

		let nonFolderCharacters = game.actors.filter((a) => 
			   !actors.map((aa) => aa.id).includes(a.id) 
			&& !a.isLoot 
			&& !a.name.startsWith('user') 
			&& a.hasPlayerOwner
		);

		nonFolderCharacters.forEach((c) => {
            c.shortName = c.name.split(/\s/).shift();
            let owner = userList.find((u) => u.character === c.id )
			if (!owner) {
				owner = userList.find((u) => c.getUserLevel(u) === 3);	
			}
			if (owner) {
	            c.owner = { id: owner.id, name: owner.name };					
			}
        	actors.push(c);
        });
		
		actors = actors.filter((a) => Object.hasOwn(a, 'owner'));
		
		let excluded = actors.filter((a) => a?.userGroup?.name === 'User Manager Exclude').map((a) => a.owner.id);
		let users = game.users.filter((u) => !excluded.includes(u.id) && !u.isGM);
		users = users.map((u) => {
			let firstName = u.getFlag('user-manager','firstName');
		    let lastName = u.getFlag('user-manager','lastName');
		    let email = u.getFlag('user-manager','email');
		    let discord = u.getFlag('user-manager','discord');
			let dateCreated = u.getFlag('user-manager','dateCreated') === null ? null : new Date(u.getFlag('user-manager','dateCreated')).toLocaleDateString();
			let dateModified = u.getFlag('user-manager','dateModified') === null ? null : new Date(u.getFlag('user-manager','dateModified')).toLocaleDateString();
			let groups = actors.filter((a) => a.owner.id === u.id && Object.hasOwn(a, 'userGroup')).map((a) => a.userGroup );
			let groupNames = '';
			if (groups) {
				groups = [...new Map(groups.map((g) => [g.id, g])).values()];	
				groupNames = groups.map((g) => g.name).join(', '); //u.getFlag('user-manager','groups').map((g) => g.name).join(', ');
			}
			let characters = actors.filter((a) => a.owner.id === u.id);   //u.getFlag('user-manager','characters').map((c) => c.name).join(', ');
			let characterNames = characters.map((c) => c.name);
			return {
				id: u.id,
				role: u.role,
				name: u.name,
				firstName: firstName,
				lastName: lastName,
				email: email,
				discord: discord,
				dateCreated: dateCreated,
				dateModified: dateModified,
				groups: groups,
				groupNames: groupNames,
				characters: characters,
				characterNames: characterNames,
			}
		}).sort((a,b) => a.name.localeCompare(b.name));

		let tabs = {
			active: { id: 'active',  label: 'Active', visible: true },
			users: { id: 'users', label: 'Users', visible: true },
			characters: { id: 'characters', label: 'Characters', visible: true }
			 };
		
		this.state = {
			activeTab: this.activeTab,
			selectedUser: null,
			actors: actors,
			users: users,
			groups: folders,
			tabs
		};
		let r = document.querySelector(":root");
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			width: '60%',
			height: '60%',
			resizable: true,
			title: "User Manager",
			template: '/modules/user-manager/templates/table.hbs',
			classes: ["user-manager-window", game.system.id],
			tabs: [
				{
					navSelector: ".tabs",
					contentSelector: ".content",
					initial: "active",
				},
			],
		});
	}

	displaySelected(selectId) {
		let user = this.state.users.find((u) => u.id === selectId );
		if (!user) {
			$('#select-name').val(null);
			$('#select-role').val(null);
			$('#select-role').attr('class', '');
			$('#select-firstName').val(null);
			$('#select-lastName').val(null);
			$('#select-email').val(null);
			$('#select-discord').val(null);
			$('#select-created').html('&nbsp;');
			$('#select-modified').html('&nbsp;');
			$('#select-groups').html('');
			$('#select-characters').html(`<div class="character-box">
									<div class="character-img"><img src="systems/pf2e/icons/default-icons/character.svg"></div>
									<div class="label-character">Character</div>
								</div>`);

		} else {
			$('#select-name').val(user.name);

			let role = [null,'player','trusted-player','assistant-gm','gm'][user.role]
			$('#select-role').val(role);
			$('#select-role').attr('class', '').addClass(role);

			$('#select-firstName').val(user.firstName);
			$('#select-lastName').val(user.lastName);
			$('#select-email').val(user.email);
			$('#select-discord').val(user.discord);	
			$('#select-created').html(user.dateCreated ?? '&nbsp;');
			$('#select-modified').html(user.dateModified ?? '&nbsp;');

			let groupArr = '';
			Array.from(user.groups).forEach((g) => {
				groupArr = groupArr + `<div class="table-row"><div class="text" align="right">${g.name}</div></div>`
			})
			$('#select-groups').html(groupArr);

			let charArr = '';
			Array.from(user.characters).forEach((c) => {
				charArr = charArr + `<div class="character-box">
										<div class="character-img"><img src="${c.img}"></div>
										<div class="label-character">${c.name}</div>
									</div>`
			})
			$('#select-characters').html(charArr);			
		}
	}

	getValues(userId) {
		let uRole;
		switch ($('#select-role').val()) {
			case 'player': 
				uRole = 1;
				break;
			case 'trusted-player': 
				uRole = 2;
				break;
			case 'assistant-gm':
				uRole = 3;
				break;
			case 'gm': 
				uRole = 4;
				break;
		};
		return {
					id: userId,
					name: $('#select-name').val(),
					role: uRole,
					firstName: $('#select-firstName').val(),
					lastName: $('#select-lastName').val(),
					email: $('#select-email').val(),
					discord: $('#select-discord').val(),
					dateModified: new Date().toLocaleDateString(),
				}
	}

	async arcApply(data) {
		let user = game.users.find((u) => u.id === data.id);
		if (user) {
			let updates = {
				name: data.name,
				role: data.role,
				'flags.user-manager.name': data.name,
				'flags.user-manager.role': data.role,
				'flags.user-manager.firstName': data.firstName,
				'flags.user-manager.lastName': data.lastName,
				'flags.user-manager.email': data.email,
				'flags.user-manager.discord': data.discord,
				'flags.user-manager.email': data.email,
				'flags.user-manager.dateModified': data.dateModified,
			}
			await user.update(updates);
			this.update();
		} else {
			ui.notifications.warn('No user selected.');
		}
	}

	redrawRow(data) {
		$(`#${data.id}-name`).text(data.name);
		$(`#${data.id}-dateModified`).text(data.dateModified);
	}

	redrawTable() {
		let template = `{{#each users as | user | }}
		            <div class="table-row" id="{{ user.id }}">
		                <div class="text firstCol"><span id="{{ user.id }}-name">{{ user.name }}</span></div>
		                <div class="text other"><span id="{{ user.id }}-dateCreated">{{ user.dateCreated }}</span></div>
		                <div class="text"><span id="{{ user.id }}-dateModified">{{ user.dateModified }}</span></div>
		                <div class="text"><span id="{{ user.id }}-groupNames">{{ user.groupNames }}</span></div>
		                <div class="text"><span id="{{ user.id }}-characterNames">{{ user.characterNames }}</span></div>
		            </div>
		            {{/each}}`;
		let compiled = Handlebars.compile(template);
		$('#userTable').html(compiled(this.state));
	}

	async createUser(data) {
		if (data.name && data.role) {
			let actor = await Actor.implementation.create( {
		        name: data.name.trim(),
		        type: "character",
		    } );

			let newUser = await User.create( {
				name: data.name.trim(), 
				role: data.role, 
				character: actor,
			} );

			let userId = newUser.id;
	        let permissions = actor.data.permission;
	        permissions[userId] = 3;
	        await actor.update({
	            permission: permissions
	        });

			if (newUser) {
				let updates = {
					'flags.user-manager.name': data.name,
					'flags.user-manager.role': data.role,
					'flags.user-manager.firstName': data.firstName,
					'flags.user-manager.lastName': data.lastName,
					'flags.user-manager.email': data.email,
					'flags.user-manager.discord': data.discord,
					'flags.user-manager.email': data.email,
					'flags.user-manager.dateCreated': new Date().toLocaleDateString(),
					'flags.user-manager.dateModified': data.dateModified,
				}
				await newUser.update(updates);
				this.update();
			}
			this.redrawTable();
	        ui.notifications.info(`User ${newUser.name} created.`)
			return newUser;

		} else {
			ui.notifications.warn('Name and Role are required.')
		}
	}

	toggleInputs(showHide) {
		if (showHide === 'show') {
			$('#form-inputs :input').attr('disabled',false);
			$('#form-inputs').removeClass('inactive');
		} else if (showHide === 'hide') {
			$('#form-inputs :input').attr('disabled',true);
			$('#form-inputs').addClass('inactive');
		} else {
			if ($('#form-inputs :input').is(':disabled')) {
				$('#form-inputs :input').attr('disabled',false);
				$('#form-inputs').removeClass('inactive');
			} else {
				$('#form-inputs :input').attr('disabled', true);
				$('#form-inputs').addClass('inactive');
			}
		}
	}

	toggleGroupPicker(showHide) {
		if (showHide === 'show') {
			let folders = game.folders.filter((f) => f.type === 'Actor');
			let groupArr = '';
			Array.from(folders).forEach((g) => {
				groupArr = groupArr + `<div class="table-row selectable" id=${g.id}><div class="text" align="right">${g.name}</div></div>`
			});
			$('#select-groups').html(groupArr);	
		} else if (showHide === 'hide') {
			$('#select-groups').html('');
		} else {
			if ($('#arc-btn-new').html() === 'Create') {
				let folders = game.folders.filter((f) => f.type === 'Actor');
				let groupArr = '';
				Array.from(folders).forEach((g) => {
					groupArr = groupArr + `<div class="table-row selectable" id=${g.id}><div class="text" align="right">${g.name}</div></div>`
				});
				$('#select-groups').html(groupArr);	
			} else {
				$('#select-groups').html('');
			}	
		}
	}

	getData() {
		this.update();
		return this.state;
	}

	activateListeners(html) {
		let self = this;

		// $('*').click(function() {
			// console.log($(this)[0]);
		// });
	
		$('.left .table-row').click(function() {
			let selectId;
			if ($(this).hasClass('selected')) {
				$(this).removeClass('selected');
				selectId = null;
				self.toggleInputs('hide');
			} else {
				$(this).addClass('selected').siblings().removeClass('selected');
				selectId = $(this).attr('id');
				self.toggleInputs('show');
			}
			self.displaySelected(selectId);
			self.state.selectedUser = selectId;
			$('#arc-btn-new').text('New User');	
		});

		// $('.group-box').on('click', () => console.log('fail'));

		// $('.table-row.selectable').on('click', () => console.log('win'));

		$('.table-row.selectable').on('click', function() {
			console.log('click');
			let groupId;
			if ($(this).hasClass('selected')) {
				$(this).removeClass('selected');
				groupId = null;
			} else {
				$(this).addClass('selected').siblings().removeClass('selected');
				groupId = $(this).attr('id');
			}
			console.log(groupId);
			self.state.selectedGroup = groupId;
		});
		
		$('#select-role').on('change', function(ev) {
		    $(this).attr('class', '').addClass($(this).children(':selected').val());		    
		});

		$('#arc-btn-apply').on('click', async (event) => {
			let userId = self.state.selectedUser;
			let data = self.getValues(userId);
			await self.arcApply(data);
			self.redrawRow(data);
			self.state.selectedUser = userId;
		});

		$('#arc-btn-cancel').on('click', (event) => {
			if (this.state.selectedUser) {
				self.displaySelected(self.state.selectedUser);	
			} else {
				$('#arc-btn-new').html('New User');
				this.toggleInputs('hide');
				this.toggleGroupPicker('hide');
			}
		});

		$('#arc-btn-new').on('click', function(event) {
			if ($(this).html() === 'New User') {
				self.displaySelected(null);
				self.toggleInputs('show');
				$(`#${self.state.selectedUser}`).removeClass('selected');
				self.state.selectedUser = null;	
				$(this).html('Create');
				self.toggleGroupPicker('show');	
			} else if ($(this).html() === 'Create') {				
				let data = self.getValues(null);
				if (data.name && data.role) {
					self.createUser(data);
					self.toggleInputs('hide');
					self.toggleGroupPicker('hide');
				} else {
					ui.notifications.warn('User Name and Role are required.')
				}
			}
		});

		super.activateListeners(html);
		game.userManager.toggleInputs('hide');
	}

	render(force, options) {
		this.rendering = true;
		super.render(force, options);
	}

	close() {
		this.rendering = false;
		super.close();
	}
}

export default UserManagerApp;
