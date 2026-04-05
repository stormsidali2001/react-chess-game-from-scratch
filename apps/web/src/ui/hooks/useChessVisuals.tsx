import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
    domainEventDispatcher,
    GameStatusChangedEvent,
    PieceCapturedEvent,
    PawnPromotedEvent,
    CastledEvent,
    GameStatus
} from '@chess/engine';

export function useChessVisuals() {
    const [isShaking, setIsShaking] = useState(false);
    const [flashingSquares, setFlashingSquares] = useState<Record<string, boolean>>({});

    useEffect(() => {
        // 1. Handle Game Status Changes (Check / Checkmate)
        const handleStatusChanged = (event: GameStatusChangedEvent) => {
            if (event.status === GameStatus.CHECKMATE) {
                toast.success("Checkmate!", {
                    duration: 5000,
                    position: 'top-center',
                    style: { background: '#1e293b', color: '#fff', fontWeight: 'bold' }
                });

                // Trigger a shake
                setIsShaking(true);
                setTimeout(() => setIsShaking(false), 500);
            } else if (event.status === GameStatus.CHECK) {
                toast.error("Check!", {
                    duration: 3000,
                    position: 'top-center',
                    icon: '⚠️',
                    style: { background: '#ef4444', color: '#fff', fontWeight: 'bold' }
                });

                setIsShaking(true);
                setTimeout(() => setIsShaking(false), 500);
            } else if (event.status === GameStatus.DRAW || event.status === GameStatus.STALEMATE) {
                toast('Game Over - Draw', { icon: '🤝' });
            }
        };

        // 2. Handle Piece Captures
        const handlePieceCaptured = (event: PieceCapturedEvent) => {
            const posKey = event.at.toAlgebraic();
            setFlashingSquares((prev) => ({ ...prev, [posKey]: true }));

            // Toast for high-value captures purely for visual fun
            if (event.piece.type === 'queen') {
                toast(`Queen captured!`, { icon: '💥' });
            }

            // Remove flash after animation ends (400ms)
            setTimeout(() => {
                setFlashingSquares((prev) => ({ ...prev, [posKey]: false }));
            }, 400);
        };

        // 3. Handle Pawn Promotions
        const handlePawnPromoted = (event: PawnPromotedEvent) => {
            toast.success(`Pawn promoted to ${event.promotedTo}!`, {
                duration: 3000,
                position: 'top-center',
                style: { background: '#1e293b', color: '#fff', fontWeight: 'bold' }
            });
        };

        // 4. Handle Castling
        const handleCastled = (event: CastledEvent) => {
            const label = event.side === 'kingside' ? 'Castled kingside' : 'Castled queenside';
            toast(label, {
                duration: 2000,
                position: 'top-center',
                icon: '🏰',
            });
        };

        domainEventDispatcher.register(GameStatusChangedEvent, handleStatusChanged);
        domainEventDispatcher.register(PieceCapturedEvent, handlePieceCaptured);
        domainEventDispatcher.register(PawnPromotedEvent, handlePawnPromoted);
        domainEventDispatcher.register(CastledEvent, handleCastled);

        // Cleanup
        return () => {
            domainEventDispatcher.unregister(GameStatusChangedEvent, handleStatusChanged);
            domainEventDispatcher.unregister(PieceCapturedEvent, handlePieceCaptured);
            domainEventDispatcher.unregister(PawnPromotedEvent, handlePawnPromoted);
            domainEventDispatcher.unregister(CastledEvent, handleCastled);
        };
    }, []);

    return {
        isShaking,
        flashingSquares
    };
}
