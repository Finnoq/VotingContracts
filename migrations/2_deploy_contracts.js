const Voting = artifacts.require('./Voting.sol');

module.exports = function(deployer, network, accounts) {
    deployer.deploy( Voting, accounts )
        .then(() => { return Voting.deployed() })
        .then(deployedVoting => {
            console.log("deployed voting:", deployedVoting.address);
        });
};
