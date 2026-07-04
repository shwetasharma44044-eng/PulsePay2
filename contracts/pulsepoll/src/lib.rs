#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Map, String, Vec};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct PollQuestion {
    pub question: String,
    pub options: Vec<String>,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Question,
    Voted(Address),
    Votes,
    Initialized,
}

#[contract]
pub struct PulsePollContract;

#[contractimpl]
impl PulsePollContract {
    pub fn initialize(env: Env, question: String, options: Vec<String>) {
        if env.storage().instance().has(&DataKey::Initialized) {
            panic!("Already initialized");
        }
        
        if options.len() < 2 {
            panic!("Must have at least 2 options");
        }

        let poll = PollQuestion {
            question,
            options,
        };
        env.storage().instance().set(&DataKey::Question, &poll);
        
        let mut votes = Map::new(&env);
        for i in 0..poll.options.len() {
            votes.set(i as u32, 0u32);
        }
        env.storage().instance().set(&DataKey::Votes, &votes);
        env.storage().instance().set(&DataKey::Initialized, &true);
    }

    pub fn vote(env: Env, voter: Address, option: u32) {
        voter.require_auth();
        
        if !env.storage().instance().has(&DataKey::Initialized) {
            panic!("Not initialized");
        }
        
        let voted_key = DataKey::Voted(voter.clone());
        if env.storage().persistent().has(&voted_key) {
            panic!("Already voted");
        }
        
        let poll: PollQuestion = env.storage().instance().get(&DataKey::Question).unwrap();
        if option >= poll.options.len() as u32 {
            panic!("Invalid option");
        }
        
        let mut votes: Map<u32, u32> = env.storage().instance().get(&DataKey::Votes).unwrap();
        let current_votes = votes.get(option).unwrap_or(0);
        votes.set(option, current_votes + 1);
        env.storage().instance().set(&DataKey::Votes, &votes);
        
        env.storage().persistent().set(&voted_key, &true);
        
        env.events().publish(
            (symbol_short!("vote_cast"), voter.clone()),
            (option, votes.clone())
        );
    }

    pub fn get_results(env: Env) -> Map<u32, u32> {
        if !env.storage().instance().has(&DataKey::Initialized) {
            return Map::new(&env);
        }
        env.storage().instance().get(&DataKey::Votes).unwrap_or_else(|| Map::new(&env))
    }

    pub fn get_question(env: Env) -> PollQuestion {
        if !env.storage().instance().has(&DataKey::Initialized) {
            panic!("Not initialized");
        }
        env.storage().instance().get(&DataKey::Question).unwrap()
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{Env, Address, testutils::Address as _};

    #[test]
    fn test_poll() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, PulsePollContract);
        let client = PulsePollContractClient::new(&env, &contract_id);

        let question = String::from_str(&env, "Do you prefer Stellar or Ethereum?");
        let mut options = Vec::new(&env);
        options.push_back(String::from_str(&env, "Stellar"));
        options.push_back(String::from_str(&env, "Ethereum"));

        client.initialize(&question, &options);

        let poll = client.get_question();
        assert_eq!(poll.question, question);
        assert_eq!(poll.options.len(), 2);

        let results = client.get_results();
        assert_eq!(results.get(0).unwrap(), 0);
        assert_eq!(results.get(1).unwrap(), 0);

        let voter1 = Address::generate(&env);
        client.vote(&voter1, &0);

        let results_after = client.get_results();
        assert_eq!(results_after.get(0).unwrap(), 1);
        assert_eq!(results_after.get(1).unwrap(), 0);

        // Double vote check
        let result = client.try_vote(&voter1, &0);
        assert!(result.is_err());
    }
}
