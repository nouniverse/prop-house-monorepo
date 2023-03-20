import {
  Community,
  StoredProposalWithVotes,
  StoredAuctionBase,
} from '@nouns/prop-house-wrapper/dist/builders';
import classes from './RoundModules.module.css';
import { Col } from 'react-bootstrap';
import { AuctionStatus, auctionStatus } from '../../utils/auctionStatus';
import clsx from 'clsx';
import getWinningIds from '../../utils/getWinningIds';
import UserPropCard from '../UserPropCard';
import AcceptingPropsModule from '../AcceptingPropsModule';
import TimedRoundVotingModule from '../TimedRoundVotingModule';
import RoundOverModule from '../RoundOverModule';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { isSameAddress } from '../../utils/isSameAddress';
import { isInfAuction, isTimedAuction } from '../../utils/auctionType';
import { useAccount } from 'wagmi';
import InfRoundVotingModule from '../InfRoundVotingModule';
import { useAppSelector } from '../../hooks';

const RoundModules: React.FC<{
  auction: StoredAuctionBase;
  proposals: StoredProposalWithVotes[];
  community: Community;
  setShowVotingModal: Dispatch<SetStateAction<boolean>>;
}> = props => {
  const { auction, proposals, community, setShowVotingModal } = props;

  const { address: account } = useAccount();
  const votingPower = useAppSelector(state => state.voting.votingPower);
  const winningIds = getWinningIds(proposals, auction);
  const [userProposals, setUserProposals] = useState<StoredProposalWithVotes[]>();

  // auction statuses
  const auctionNotStarted = auctionStatus(auction) === AuctionStatus.AuctionNotStarted;
  const isProposingWindow = auctionStatus(auction) === AuctionStatus.AuctionAcceptingProps;
  const isVotingWindow = auctionStatus(auction) === AuctionStatus.AuctionVoting;
  const isRoundOver = auctionStatus(auction) === AuctionStatus.AuctionEnded;

  const getVoteTotal = () =>
    proposals.reduce((total, prop) => (total = total + Number(prop.voteCount)), 0);
  const [fetchedUserProps, setFetchedUserProps] = useState(false);

  useEffect(() => {
    if (!account || !proposals) return;
    setFetchedUserProps(false);

    // set user props
    if (proposals.some(p => isSameAddress(p.address, account))) {
      setUserProposals(
        proposals
          .filter(p => isSameAddress(p.address, account))
          .sort((a: { voteCount: any }, b: { voteCount: any }) =>
            Number(a.voteCount) < Number(b.voteCount) ? 1 : -1,
          ),
      );

      setFetchedUserProps(true);
    }
  }, [account, proposals]);

  return (
    <Col xl={4} className={clsx(classes.sideCards, classes.carousel, classes.breakOut)}>
      {!auctionNotStarted &&
        account &&
        userProposals &&
        userProposals.length > 0 &&
        fetchedUserProps && (
          <UserPropCard
            userProps={userProposals}
            proposals={proposals}
            numOfWinners={isInfAuction(auction) ? 0 : auction.numWinners}
            status={auctionStatus(auction)}
            winningIds={winningIds && winningIds}
          />
        )}

      {(isTimedAuction(auction) && isProposingWindow) ||
      (isInfAuction(auction) && votingPower === 0) ? (
        <AcceptingPropsModule auction={auction} community={community} />
      ) : null}

      {isTimedAuction(auction) && isVotingWindow && (
        <TimedRoundVotingModule
          communityName={community.name}
          setShowVotingModal={setShowVotingModal}
          totalVotes={getVoteTotal()}
        />
      )}

      {isInfAuction(auction) && (!account || votingPower > 0) && (
        <InfRoundVotingModule setShowVotingModal={setShowVotingModal} />
      )}

      {isRoundOver && (
        <RoundOverModule numOfProposals={proposals.length} totalVotes={getVoteTotal()} />
      )}
    </Col>
  );
};
export default RoundModules;
