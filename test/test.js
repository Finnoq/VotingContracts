const {advanceBlock} = require('./helpers/advanceToBlock');
const {increaseTimeTo, duration} = require('./helpers/increaseTime');
const {latestTime} = require('./helpers/latestTime');
const {EVMRevert} = require('./helpers/EVMRevert');
/*
const Web3 = require('web3')

var web3
import getWeb3 from './utils/getWeb3'
*/

require('chai')
    .use(require('chai-as-promised'))
    .use(require('bn-chai')(web3.utils.BN))
    .should();

const Voting = artifacts.require("Voting");

contract('Voting', function (
    [
        owner,
        authorized,
        investorWhitelisted,
        investorNotWhitelisted
    ]) {

    before(async function () {
        await advanceBlock();
    });

    beforeEach(async function () {
        this.contract = await Voting.new([owner, authorized]);
        await this.contract.addAddressToWhitelist(investorWhitelisted);
    });

    it('should reject not authorized people create a poll', async function () {
        const pollId = 1;
        const openingTime = await latestTime();
        const closingTime = await latestTime() + duration.hours(2);

        await this.contract.createPoll(pollId, openingTime, closingTime, {
            from: investorWhitelisted
        }).should.be.rejectedWith(EVMRevert);
    })

    it('should accept authorized people create poll', async function () {
        const pollId = 1;
        const openingTime = await latestTime();
        const closingTime = await latestTime() + duration.hours(2);

        await this.contract.createPoll(pollId, openingTime, closingTime, {
            from: authorized
        }).should.be.fulfilled;
    });

    it('should reject not authorized people add question to poll', async function () {
        const pollId = 1, questionId = 3, answersId = [3, 7, 8, 10];
        const openingTime = await latestTime();
        const closingTime = await latestTime() + duration.hours(2);

        await this.contract.createPoll(pollId, openingTime, closingTime, {
            from: authorized
        }).should.be.fulfilled;

        await this.contract.addQuestionToPoll(pollId, questionId, answersId.length, {
            from: investorWhitelisted
        }).should.be.rejectedWith(EVMRevert);
    })

    it('should accept authorized people add question to poll', async function () {
        const pollId = 1, questionId = 3, answersId = [3, 7, 8, 10];
        const openingTime = await latestTime();
        const closingTime = await latestTime() + duration.hours(2);

        await this.contract.createPoll(pollId, openingTime, closingTime, {
            from: authorized
        }).should.be.fulfilled;

        await this.contract.addQuestionToPoll(pollId, questionId, answersId.length, {
            from: authorized
        }).should.be.fulfilled;
    });

    it('should reject add question to non-existent polls', async function () {
        const pollId = 1, questionId = 3, answersId = [3, 7, 8, 10];
        await this.contract.addQuestionToPoll(pollId, questionId, answersId.length, {
            from: authorized
        }).should.be.rejectedWith(EVMRevert);
    });

    it('should accept authorized people add more than one question to poll', async function () {
        const pollId = 1, question1Id = 3, question2Id = 4, answersId = [3, 7, 8, 10];
        const openingTime = await latestTime();
        const closingTime = await latestTime() + duration.hours(2);

        await this.contract.createPoll(pollId, openingTime, closingTime, {
            from: authorized
        }).should.be.fulfilled;

        await this.contract.addQuestionToPoll(pollId, question1Id, answersId.length, {
            from: authorized
        }).should.be.fulfilled;

        await this.contract.addQuestionToPoll(pollId, question2Id, answersId.length, {
            from: authorized
        }).should.be.fulfilled;
    });

    it('should reject votes of people not whitelisted', async function () {
        const pollId = 1, questionId = 3, answersId = [3, 7, 8, 10], voteId = 10;
        const openingTime = await latestTime() + duration.hours(1);
        const closingTime = await latestTime() + duration.hours(2);
        const key = 'werty2ui3ol5k6m7m83n4bv5ch';
        const vote = questionId.toString() + voteId.toString();
        let encryptedVotes;
        await this.contract.getHash.call(web3.utils.asciiToHex(vote), web3.utils.asciiToHex(key)).then(res => {
            encryptedVotes = res
        });

        await this.contract.createPoll(pollId, openingTime, closingTime, {
            from: authorized
        }).should.be.fulfilled;

        await this.contract.addQuestionToPoll(pollId, questionId, answersId.length, {
            from: authorized
        }).should.be.fulfilled;

        await this.contract.commitVote(pollId, encryptedVotes, {
            from: investorNotWhitelisted
        }).should.be.rejectedWith(EVMRevert);

        await increaseTimeTo(openingTime);
        await this.contract.commitVote(pollId, encryptedVotes, {
            from: investorNotWhitelisted
        }).should.be.rejectedWith(EVMRevert);

        await increaseTimeTo(closingTime);
        await this.contract.commitVote(pollId, encryptedVotes, {
            from: investorNotWhitelisted
        }).should.be.rejectedWith(EVMRevert);
    });

    it('should reject votes of whitelisted people before the opening time of the poll', async function () {
        const pollId = 1, questionId = 3, answersId = [3, 7, 8, 10], voteId = 10;
        const openingTime = await latestTime() + duration.hours(1);
        const closingTime = await latestTime() + duration.hours(2);
        const key = 'werty2ui3ol5k6m7m83n4bv5ch';
        const vote = questionId.toString() + voteId.toString();
        let encryptedVotes;
        await this.contract.getHash.call(web3.utils.asciiToHex(vote), web3.utils.asciiToHex(key)).then(res => {
            encryptedVotes = res
        });

        await this.contract.createPoll(pollId, openingTime, closingTime, {
            from: authorized
        }).should.be.fulfilled;

        await this.contract.addQuestionToPoll(pollId, questionId, answersId.length, {
            from: authorized
        }).should.be.fulfilled;

        await this.contract.commitVote(pollId, encryptedVotes, {
            from: investorWhitelisted
        }).should.be.rejectedWith(EVMRevert);
    })

    it('should accept votes of whitelisted people during the opening time of the poll', async function () {
        const pollId = 1, questionId = 3, answersId = [3, 7, 8, 10], voteId = 10;
        const openingTime = await latestTime() + duration.hours(1);
        const closingTime = await latestTime() + duration.hours(2);
        const key = 'werty2ui3ol5k6m7m83n4bv5ch';
        const vote = questionId.toString() + voteId.toString();
        let encryptedVotes;
        await this.contract.getHash.call(web3.utils.asciiToHex(vote), web3.utils.asciiToHex(key)).then(res => {
            encryptedVotes = res
        });

        await this.contract.createPoll(pollId, openingTime, closingTime, {
            from: authorized
        }).should.be.fulfilled;

        await this.contract.addQuestionToPoll(pollId, questionId, answersId.length, {
            from: authorized
        }).should.be.fulfilled;

        await increaseTimeTo(openingTime);
        await this.contract.commitVote(pollId, encryptedVotes, {
            from: investorWhitelisted
        }).should.be.fulfilled;
    })

    it('should reject votes of whitelisted people after the closing time of the poll', async function () {
        const pollId = 1, questionId = 3, answersId = [3, 7, 8, 10], voteId = 10;
        const openingTime = await latestTime() + duration.hours(1);
        const closingTime = await latestTime() + duration.hours(2);
        const key = 'werty2ui3ol5k6m7m83n4bv5ch';
        const vote = questionId.toString() + voteId.toString();
        let encryptedVotes;
        await this.contract.getHash.call(web3.utils.asciiToHex(vote), web3.utils.asciiToHex(key)).then(res => {
            encryptedVotes = res
        });

        await this.contract.createPoll(pollId, openingTime, closingTime, {
            from: authorized
        }).should.be.fulfilled;

        await this.contract.addQuestionToPoll(pollId, questionId, answersId.length, {
            from: authorized
        }).should.be.fulfilled;

        await increaseTimeTo(closingTime);
        await this.contract.commitVote(pollId, encryptedVotes, {
            from: investorWhitelisted
        }).should.be.rejectedWith(EVMRevert);
    })

    it('should reject votes to non-existent polls', async function () {
        const pollId = 1, questionId = 3, voteId = 10;
        const key = 'werty2ui3ol5k6m7m83n4bv5ch';
        const vote = questionId.toString() + voteId.toString();
        let encryptedVotes;
        await this.contract.getHash.call(web3.utils.asciiToHex(vote), web3.utils.asciiToHex(key)).then(res => {
            encryptedVotes = res
        });

        await this.contract.commitVote(pollId, encryptedVotes, {
            from: investorWhitelisted
        }).should.be.rejectedWith(EVMRevert);
    });

    it('should reject reveal votes of not whitelisted people', async function () {
        const pollId = 1, questionsId = [3], answersId = [3, 7, 8, 10], votesId = [10];
        const openingTime = await latestTime();
        const closingTime = await latestTime() + duration.hours(2);
        const key = 'werty2ui3ol5k6m7m83n4bv5ch';
        const vote = questionsId[0].toString() + votesId[0].toString();
        let encryptedVotes;
        await this.contract.getHash.call(web3.utils.asciiToHex(vote), web3.utils.asciiToHex(key)).then(res => {
            encryptedVotes = res
        });

        await this.contract.createPoll(pollId, openingTime, closingTime, {
            from: authorized
        }).should.be.fulfilled;

        await this.contract.addQuestionToPoll(pollId, questionsId[0], answersId.length, {
            from: authorized
        }).should.be.fulfilled;

        await this.contract.commitVote(pollId, encryptedVotes, {
            from: investorWhitelisted
        }).should.be.fulfilled;

        await increaseTimeTo(closingTime);
        await this.contract.revealVote(pollId, web3.utils.asciiToHex(vote), web3.utils.asciiToHex(key), {
            from: investorNotWhitelisted
        }).should.be.rejectedWith(EVMRevert);
    })

    it('should reject reveal votes of whitelisted people before the poll finishes', async function () {
        const pollId = 1, questionsId = [3], answersId = [3, 7, 8, 10], votesId = [10];
        const openingTime = await latestTime();
        const closingTime = await latestTime() + duration.hours(2);
        const key = 'werty2ui3ol5k6m7m83n4bv5ch';
        const vote = questionsId[0].toString() + votesId[0].toString();
        let encryptedVotes;
        await this.contract.getHash.call(web3.utils.asciiToHex(vote), web3.utils.asciiToHex(key)).then(res => {
            encryptedVotes = res
        });

        await this.contract.createPoll(pollId, openingTime, closingTime, {
            from: authorized
        }).should.be.fulfilled;

        await this.contract.addQuestionToPoll(pollId, questionsId[0], answersId.length, {
            from: authorized
        }).should.be.fulfilled;

        await this.contract.commitVote(pollId, encryptedVotes, {
            from: investorWhitelisted
        }).should.be.fulfilled;

        await this.contract.revealVote(pollId, web3.utils.asciiToHex(vote), web3.utils.asciiToHex(key), {
            from: investorWhitelisted
        }).should.be.rejectedWith(EVMRevert);
    });

    it('should accept reveal votes of whitelisted people after the poll finishes', async function () {
        const pollId = 1, questionsId = [3], answersId = [3, 7, 8, 10], votesId = [10];
        const openingTime = await latestTime();
        const closingTime = await latestTime() + duration.hours(2);
        const key = 'werty2ui3ol5k6m7m83n4bv5ch';
        const vote = questionsId[0].toString() + votesId[0].toString();
        let encryptedVotes;
        await this.contract.getHash.call(web3.utils.asciiToHex(vote), web3.utils.asciiToHex(key)).then(res => {
            encryptedVotes = res
        });

        await this.contract.createPoll(pollId, openingTime, closingTime, {
            from: authorized
        }).should.be.fulfilled;

        await this.contract.addQuestionToPoll(pollId, questionsId[0], answersId.length, {
            from: authorized
        }).should.be.fulfilled;

        await this.contract.commitVote(pollId, encryptedVotes, {
            from: investorWhitelisted
        }).should.be.fulfilled;

        await increaseTimeTo(closingTime)
        await this.contract.revealVote(pollId, web3.utils.asciiToHex(vote), web3.utils.asciiToHex(key), {
            from: investorWhitelisted
        }).should.be.fulfilled
    })

    it('should reject reveal votes of non-existent polls', async function () {
        const pollId = 1, questionsId = [3], answersId = [3, 7, 8, 10], votesId = [10];
        const key = 'werty2ui3ol5k6m7m83n4bv5ch';
        const vote = questionsId[0].toString() + votesId[0].toString();
        let encryptedVotes;
        await this.contract.getHash.call(web3.utils.asciiToHex(vote), web3.utils.asciiToHex(key)).then(res => {
            encryptedVotes = res
        });

        await this.contract.revealVote(pollId, web3.utils.asciiToHex(vote), web3.utils.asciiToHex(key), {
            from: investorWhitelisted
        }).should.be.rejectedWith(EVMRevert);
    });
});
