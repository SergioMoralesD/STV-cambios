import { useState, useEffect, useCallback } from 'react';
import { fetchFlyFB } from '../../../services/flyfbService';
import type { FlyFBItem } from '../../../services/flyfbService';
import { IslaTable } from '../../../Components/FLyFB/IslaTable';
import { Loader } from '../../../Components/common/Loader';
import useBackgroundImage from '../../../Hooks/useBackgroundImage';
import { parseMpsConImagenes } from '../../../config/regionConfig';
import { ISLA_IMG } from '../../../services/helpers';
import { getClientCounts } from '../../../services/commonLogic';
import './FLyFB.css';

interface Props {
    mps?: string;
}

export default function FLyFB({ mps }: Props) {
    const mainplants = parseMpsConImagenes(mps || '', ISLA_IMG);

    const [data, setData] = useState<FlyFBItem[]>([]);
    const [loading, setLoading] = useState(true);

    useBackgroundImage('/img/Fondo_Escritorio_2.jpg', 'Trabajo FL y FB');

    const loadData = useCallback(async () => {
        if (!mps) {
            setLoading(false);
            return;
        }
        try {
            const tickets = await fetchFlyFB(mps);
            setData(tickets);
        } catch (error) {
            console.error("Error al cargar tickets");
        } finally {
            setLoading(false);
        }
    }, [mps]);

    useEffect(() => {
        setLoading(true);
        loadData();
        const interval = setInterval(loadData, 60000);
        return () => clearInterval(interval);
    }, [loadData]);

    return (
        <div className="flyfb-page">
            {loading && <Loader />}
            <div className="flyfb-grid">
                {(() => {
                    const clientCounts = getClientCounts(data);
                    return mainplants.map((isla) => {
                        const datosIsla = data.filter((d) => d.delegacion === isla.mainplant);
                        return (
                            <IslaTable
                                key={isla.mainplant}
                                isla={isla}
                                datos={datosIsla}
                                totalIslas={mainplants.length}
                                clientCounts={clientCounts}
                            />
                        );
                    });
                })()}
            </div>
        </div>
    );
}  