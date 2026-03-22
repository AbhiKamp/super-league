import React, { useEffect, useState } from 'react';
import { useLeague } from '../context/LeagueContext';
import { ArrowLeft, Loader2, Shield, Hexagon } from 'lucide-react';
import styles from './PlayerProfile.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const getStatColor = (val) => {
    if (val >= 80) return 'bg-[#00e676]';
    if (val >= 70) return 'bg-[#ffc400]';
    if (val >= 60) return 'bg-[#ff9100]';
    return 'bg-[#ff1744]';
};

const getCardBackground = (rating) => {
    const num = parseInt(rating) || 50;
    if (num >= 85) return "url('/gold.png')";
    if (num >= 70) return "url('/silver.png')";
    return "url('/bronze.png')";
};

const getCardTextColor = (rating) => {
    const num = parseInt(rating) || 50;
    if (num >= 85) return "text-amber-950";
    if (num >= 70) return "text-zinc-900";
    return "text-orange-950";
};

const defaultAttributes = {
    bio: { preferredFoot: "Right" },
    stats: {
        Pace: { total: 0 },
        Shooting: { total: 0 },
        Passing: { total: 0 },
        Dribbling: { total: 0 },
        Defending: { total: 0 },
        Physicality: { total: 0 }
    },
    playStyles: []
};

export default function PlayerProfile() {
    const { setView } = useLeague();
    const [player, setPlayer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const raw = sessionStorage.getItem('selectedPlayer');
        if (!raw) {
            setView('teams');
            return;
        }

        const base = JSON.parse(raw);

        fetch(`${API_BASE_URL}/players/${base.id}`)
            .then(r => r.json())
            .then(res => {
                if (res.success) setPlayer(res.data);
                else setError('Failed to load player.');
            })
            .catch(() => setError('Failed to load player.'))
            .finally(() => setLoading(false));
    }, []);

    const handleBack = () => {
        sessionStorage.removeItem('selectedPlayer');
        setView('teams');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-500 animate-pulse space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-white/20" />
                <span className="font-black tracking-[0.3em] uppercase text-sm">
                    Loading Player...
                </span>
            </div>
        );
    }

    if (error || !player) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-500 space-y-4">
                <Shield className="w-12 h-12 text-zinc-700" />
                <span className="font-black tracking-[0.3em] uppercase text-sm">
                    {error || 'Player not found'}
                </span>
                <button
                    onClick={handleBack}
                    className="text-xs text-zinc-400 hover:text-white uppercase tracking-widest font-bold transition-colors"
                >
                    Back to Teams
                </button>
            </div>
        );
    }

    const attrs = player.attributes || defaultAttributes;
    const stats = attrs.stats || defaultAttributes.stats;
    const bio = attrs.bio || defaultAttributes.bio;
    const stylesArr = attrs.playStyles || [];

    const cardBgImage = getCardBackground(player.overall_rating);
    const cardTextColor = getCardTextColor(player.overall_rating);

    return (
        <div className="w-full bg-[#0F0E13] min-h-screen text-white p-4 md:p-8 font-sans pb-20 animate-in fade-in duration-300">
            <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group"
            >
                <ArrowLeft
                    size={20}
                    className="group-hover:-translate-x-1 transition-transform"
                />
                Back to Squad
            </button>

            <div className="flex flex-col xl:flex-row gap-8 max-w-7xl mx-auto">

                <div className="flex flex-col lg:flex-row xl:flex-col gap-6 w-full xl:w-1/3 shrink-0">

                    <div className="flex flex-col items-center sm:items-start sm:flex-row xl:flex-col xl:items-center gap-6">

                        <div
                            className="relative w-[260px] h-[380px] shrink-0 bg-center bg-no-repeat select-none flex flex-col drop-shadow-2xl overflow-hidden"
                            style={{
                                backgroundImage: cardBgImage,
                                backgroundSize: '100% 100%'
                            }}
                        >

                            <div className={`absolute top-[22%] left-[16%] flex flex-col items-start z-10 ${cardTextColor}`}>
                                <span className="text-4xl font-black leading-none tabular-nums">
                                    {player.overall_rating || 50}
                                </span>
                                <span className="text-sm font-bold uppercase tracking-wider">
                                    {player.position || 'RES'}
                                </span>
                            </div>

                            <div className="absolute top-[29%] left-0 w-full flex justify-center">
                                {player.image_url ? (
                                    <img
                                        src={player.image_url}
                                        alt={player.name}
                                        className="h-[130px] object-contain drop-shadow-2xl"
                                    />
                                ) : (
                                    <Shield className={`h-[130px] w-auto opacity-40 ${cardTextColor}`} />
                                )}
                            </div>

                            <div className={`absolute bottom-[28%] left-0 w-full text-center ${cardTextColor}`}>
                                <div className="font-black text-[14px] uppercase tracking-widest">
                                    {player.last_name || player.first_name}
                                </div>
                            </div>

                            <div className={`absolute bottom-[19%] left-0 w-full px-6 ${cardTextColor}`}>
                                <div className={`text-center ${styles.cardStatsGrid}`}>
                                    {[
                                        { label: 'PAC', value: stats.Pace?.total },
                                        { label: 'SHO', value: stats.Shooting?.total },
                                        { label: 'PAS', value: stats.Passing?.total },
                                        { label: 'DRI', value: stats.Dribbling?.total },
                                        { label: 'DEF', value: stats.Defending?.total },
                                        { label: 'PHY', value: stats.Physicality?.total },
                                    ].map((stat) => (
                                        <div key={stat.label} className="flex flex-col">
                                            <span className="text-[9px] font-bold opacity-80">
                                                {stat.label}
                                            </span>
                                            <span className="text-[15px] font-black leading-none">
                                                {stat.value || 0}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                        <div className="flex flex-col xl:items-center mt-2 sm:mt-8 items-center sm:items-start text-center sm:text-left xl:text-center xl:w-full">
                            <span className="text-2xl sm:text-3xl font-bold text-gray-300 leading-tight">
                                {player.first_name}
                            </span>
                            <span className="text-4xl sm:text-5xl xl:text-6xl font-black leading-none">
                                {player.last_name}
                            </span>
                        </div>

                    </div>

                    <div className={`bg-[#1A1820] rounded-2xl p-6 border border-white/5 w-full ${styles.bioGrid}`}>
                        <div>
                            <p className="text-xs text-gray-400 mb-1">Position</p>
                            <span className="bg-white/10 px-2 py-1 rounded text-sm font-bold">
                                {player.position || '—'}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-1">Preferred Foot</p>
                            <p className="font-bold">{bio.preferredFoot || 'Right'}</p>
                        </div>
                    </div>

                </div>

                <div className="flex-1 flex flex-col gap-6">

                    <div className="bg-[#1A1820] rounded-2xl p-6 border border-white/5">
                        <h3 className="text-xl font-black uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
                            Core Attributes
                        </h3>

                        <div className={styles.coreAttributesGrid}>
                            {['Pace', 'Shooting', 'Passing', 'Dribbling', 'Defending', 'Physicality']
                                .map(category => {
                                    const val = stats[category]?.total || 0;

                                    return (
                                        <div key={category} className="flex flex-col gap-2 text-sm">
                                            <div className="flex justify-between text-gray-300 font-bold uppercase tracking-wider">
                                                <span>{category}</span>
                                                <span className="text-white text-lg tabular-nums">{val}</span>
                                            </div>

                                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${getStatColor(val)}`}
                                                    style={{ width: `${val}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    {stylesArr.length > 0 && (
                        <div className="mt-4">
                            {stylesArr.map(style => (
                                <div
                                    key={style.name}
                                    className="bg-[#1C1C24] rounded-2xl p-5 border border-white/5 flex gap-5 items-center shadow-lg"
                                >
                                    {style.icon_url ? (
                                        <img
                                            src={style.icon_url}
                                            alt={style.name}
                                            className="w-14 h-14 object-contain drop-shadow-md"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 shrink-0 flex items-center justify-center bg-black/50 rounded-xl border border-white/10">
                                            <Hexagon size={26} className="text-[#E8C881]" />
                                        </div>
                                    )}

                                    <div className="flex flex-col">
                                        <span className="font-black text-xl text-white tracking-wide">
                                            {style.name}
                                        </span>

                                        <p className="text-sm text-zinc-400 leading-relaxed mt-1">
                                            {style.description ||
                                                `Grants unique mechanics and precision on the pitch.`}
                                        </p>
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
