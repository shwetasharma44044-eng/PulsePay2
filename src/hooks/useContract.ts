import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchPollQuestion,
  fetchPollResults,
  prepareVoteTransaction,
  submitTransaction,
  fetchVoteEvents,
  getLatestLedgerSequence,
} from '../services/contractService';
import type { SorobanEventData } from '../services/contractService';
import type { PollState, TxStatus } from '../types';

export const useContract = () => {
  // Custom hook for PulsePay2 interacting with Soroban contract events
  const [pollState, setPollState] = useState<PollState>({
    question: null,
    options: [],
    results: null,
    totalVotes: 0,
    loading: true,
    error: null,
  });

  const [txStatus, setTxStatus] = useState<TxStatus>({
    step: 'idle',
  });

  const [recentEvents, setRecentEvents] = useState<SorobanEventData[]>([]);
  
  const startLedgerRef = useRef<number>(0);
  const pollingIntervalRef = useRef<any>(null);

  // Load the initial question, options, and results
  const loadPoll = useCallback(async () => {
    setPollState((s) => ({ ...s, loading: true, error: null }));
    try {
      const questionData = await fetchPollQuestion();
      const resultsData = await fetchPollResults();

      // Calculate total votes
      let total = 0;
      Object.values(resultsData).forEach((votes) => {
        total += votes;
      });

      setPollState({
        question: questionData.question,
        options: questionData.options,
        results: resultsData,
        totalVotes: total,
        loading: false,
        error: null,
      });

      // Get the latest ledger sequence to start event polling from
      const currentLedger = await getLatestLedgerSequence();
      // Look back a few ledgers to catch any recent votes
      startLedgerRef.current = Math.max(1, currentLedger - 10);
    } catch (err: any) {
      console.error('Error loading poll:', err);
      setPollState((s) => ({
        ...s,
        loading: false,
        error: err?.message || 'Failed to load poll data from contract.',
      }));
    }
  }, []);

  // Poll for results and events in the background
  const syncPollData = useCallback(async () => {
    try {
      const resultsData = await fetchPollResults();
      let total = 0;
      Object.values(resultsData).forEach((votes) => {
        total += votes;
      });

      setPollState((s) => ({
        ...s,
        results: resultsData,
        totalVotes: total,
      }));

      if (startLedgerRef.current > 0) {
        const events = await fetchVoteEvents(startLedgerRef.current);
        if (events.length > 0) {
          // Find the maximum ledger sequence in the fetched events
          const maxLedger = Math.max(...events.map((e) => e.ledger));
          // Advance start ledger so we don't fetch duplicate events next time
          startLedgerRef.current = maxLedger + 1;

          setRecentEvents((prev) => {
            // Filter out any duplicate events
            const newEvents = events.filter(
              (e) => !prev.some((p) => p.voter === e.voter && p.ledger === e.ledger)
            );
            return [...newEvents, ...prev].slice(0, 15); // keep last 15 events
          });
        }
      }
    } catch (err) {
      console.error('Error syncing poll results:', err);
    }
  }, []);

  // Start polling when component mounts
  useEffect(() => {
    loadPoll();

    pollingIntervalRef.current = setInterval(() => {
      syncPollData();
    }, 4000); // sync every 4 seconds

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [loadPoll, syncPollData]);

  // Cast a vote function
  const castVote = async (
    optionId: number,
    signFn: (xdr: string) => Promise<string>,
    voterPublicKey: string
  ) => {
    setTxStatus({ step: 'building' });

    try {
      // 1. Build & Simulate Transaction
      const preparedTx = await prepareVoteTransaction(voterPublicKey, optionId);
      
      // 2. Request user signature
      setTxStatus({ step: 'signing' });
      const txXdr = preparedTx.toXDR();
      const signedXdr = await signFn(txXdr);

      // 3. Submit Transaction to Soroban RPC
      setTxStatus({ step: 'submitting' });
      const txHash = await submitTransaction(signedXdr);

      // 4. Update status to success
      setTxStatus({
        step: 'success',
        hash: txHash,
      });

      // 5. Instantly trigger sync
      await syncPollData();
    } catch (err: any) {
      console.error('Voting process failed:', err);
      setTxStatus({
        step: 'failed',
        error: err?.message || 'An unexpected error occurred while casting your vote.',
      });
    }
  };

  const resetTxStatus = () => {
    setTxStatus({ step: 'idle' });
  };

  return {
    pollState,
    txStatus,
    recentEvents,
    castVote,
    resetTxStatus,
    reloadPoll: loadPoll,
  };
};
