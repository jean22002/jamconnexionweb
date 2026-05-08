import { Button } from "../ui/button";
import { Users, User, Eye, UserMinus, Ban, Check, X, MapPin } from "lucide-react";
import LazyImage from "../LazyImage";

function FriendRequestCard({ request, onAccept, onReject }) {
  return (
    <div className="card-venue p-5 border-2 border-primary/30" data-testid={`friend-request-card-${request.id}`}>
      <div className="flex items-start gap-4 mb-3">
        {request.from_user_image ? (
          <LazyImage 
            src={request.from_user_image} 
            alt={request.from_user_name} 
            className="w-14 h-14 rounded-full object-cover" 
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-7 h-7 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-semibold truncate">{request.from_user_name}</h3>
          {request.from_user_city && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {request.from_user_city}
            </p>
          )}
          {request.from_user_instruments && (
            <p className="text-xs text-muted-foreground truncate mt-1">{request.from_user_instruments}</p>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2">
        <Button 
          size="sm"
          className="flex-1 rounded-full bg-primary hover:bg-primary/80 gap-2"
          onClick={() => onAccept(request.id)}
          data-testid={`accept-friend-request-${request.id}`}
        >
          <Check className="w-4 h-4" />
          Accepter
        </Button>
        <Button 
          variant="outline"
          size="sm"
          className="flex-1 rounded-full border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50 gap-2"
          onClick={() => onReject(request.id)}
          data-testid={`reject-friend-request-${request.id}`}
        >
          <X className="w-4 h-4" />
          Refuser
        </Button>
      </div>
    </div>
  );
}

function FriendCard({ friend, onViewProfile, onRemove, onBlock }) {
  return (
    <div className="card-venue p-5">
      <div className="flex items-start gap-4 mb-3">
        {friend.profile_image ? (
          <LazyImage 
            src={friend.profile_image} 
            alt={friend.pseudo} 
            className="w-14 h-14 rounded-full object-cover" 
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-7 h-7 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-semibold truncate">{friend.pseudo || friend.friend_name}</h3>
          {friend.city && <p className="text-sm text-muted-foreground truncate">{friend.city}</p>}
          <div className="flex flex-wrap gap-1 mt-1">
            {friend.instruments?.slice(0, 2).map((inst, i) => (
              <span key={i} className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">{inst}</span>
            ))}
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          className="flex-1 rounded-full border-white/20 gap-2 hover:bg-white/5"
          onClick={() => onViewProfile(friend)}
        >
          <Eye className="w-4 h-4" />
          Voir
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="rounded-full border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50"
          onClick={() => onRemove(friend.friend_id)}
        >
          <UserMinus className="w-4 h-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="rounded-full border-orange-500/30 text-orange-500 hover:bg-orange-500/10 hover:border-orange-500/50"
          onClick={() => onBlock(friend.friend_id)}
        >
          <Ban className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function BlockedUserCard({ blocked, onUnblock }) {
  return (
    <div className="card-venue p-5 border-2 border-red-500/20">
      <div className="flex items-center gap-4 mb-3">
        {blocked.profile_image ? (
          <LazyImage 
            src={blocked.profile_image} 
            alt={blocked.pseudo} 
            className="w-12 h-12 rounded-full object-cover grayscale" 
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <Ban className="w-6 h-6 text-red-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{blocked.pseudo || blocked.name}</h4>
          <p className="text-xs text-red-500">Bloqué</p>
        </div>
      </div>
      <Button 
        variant="outline" 
        size="sm"
        className="w-full rounded-full border-green-500/30 text-green-500 hover:bg-green-500/10"
        onClick={() => onUnblock(blocked.user_id)}
      >
        Débloquer
      </Button>
    </div>
  );
}

export default function FriendsTab({ 
  friends, 
  friendRequests = [],
  blockedUsers,
  onAcceptRequest,
  onRejectRequest,
  onViewProfile,
  onRemoveFriend, 
  onBlockUser,
  onUnblockUser 
}) {
  return (
    <div data-testid="friends-tab">
      {/* Section Demandes reçues */}
      {friendRequests.length > 0 && (
        <div className="mb-8" data-testid="friend-requests-section">
          <h3 className="font-heading font-semibold text-lg mb-4">
            Demandes reçues ({friendRequests.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friendRequests.map((request) => (
              <FriendRequestCard 
                key={request.id} 
                request={request}
                onAccept={onAcceptRequest}
                onReject={onRejectRequest}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section Mes amis */}
      <h3 className="font-heading font-semibold text-lg mb-4">
        Mes amis {friends.length > 0 && `(${friends.length})`}
      </h3>
      {friends.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Vous n'avez pas encore d'amis</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends.map((friend) => (
            <FriendCard 
              key={friend.friend_id} 
              friend={friend}
              onViewProfile={onViewProfile}
              onRemove={onRemoveFriend}
              onBlock={onBlockUser}
            />
          ))}
        </div>
      )}
      
      {/* Section Utilisateurs bloqués */}
      {blockedUsers.length > 0 && (
        <div className="mt-8">
          <h3 className="font-heading font-semibold text-lg mb-4">Utilisateurs bloqués ({blockedUsers.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blockedUsers.map((blocked) => (
              <BlockedUserCard 
                key={blocked.user_id} 
                blocked={blocked}
                onUnblock={onUnblockUser}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
