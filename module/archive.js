const actorFolders = game.folders.filter( f => f.type === 'Actor' );
actorFolders.forEach( f => {
	if (f.name === 'User Manager Exclude') {
		f.setFlag('user-manager','exclude',true);
	} else {
		f.setFlag('user-manager','exclude',false);	
	}
});
const playerFolders = actorFolders.filter( f => !f.flags.user-manager.exclude );
const playerCharacters = playerFolders.map( f => 
	{ 
		 'group': f.name + '|' + Date.now()
		,'dateArchived': Date.now()
		,
	}
);

const users = game.users;
let userStore = users.map( u => {
	 u.name
	,'isPlayer': !u.isGM
	,'active': 1
	,'dateCreated': Date.now()
	,'firstName': null
	,'lastName': null
	,'email': null
	,'discord': null
	,'group': []
});
