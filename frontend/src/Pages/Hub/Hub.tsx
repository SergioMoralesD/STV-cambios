import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { useSelection } from '../../Context/SelectionContext';
import Loader from '../../Components/common/Loader';
import './hub.css';

const Hub = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { setSelectedRegion } = useSelection();

  useEffect(() => {
    if (!loading && user) {
      if (user.regiones && user.regiones.length === 1) {
        setSelectedRegion(user.regiones[0].codigo);
        navigate('/cordinacion', { replace: true });
      }
    }
  }, [user, loading, navigate, setSelectedRegion]);

  if (loading) return <Loader />;
  if (!user) return null;

  const handleRegionSelect = (codigo: string) => {
    setSelectedRegion(codigo);
    navigate('/cordinacion');
  };

  return (
    <div className="hub-container">
      <div className="hub-buttons">
        {user.regiones?.map((tr) => {
          const handleClick = (e: React.MouseEvent) => {
            if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            handleRegionSelect(tr.codigo);
          };

          return (
            <a
              key={tr.codigo}
              href={`/cordinacion?TR=${tr.codigo}`}
              className="btn"
              onClick={handleClick}
            >
              {tr.nombre}
            </a>
          );
        })}
        {(!user.regiones || user.regiones.length === 0) && (
          <p>No tienes regiones asignadas. Contacta con un administrador.</p>
        )}
      </div>
    </div>
  );
};

export default Hub;  