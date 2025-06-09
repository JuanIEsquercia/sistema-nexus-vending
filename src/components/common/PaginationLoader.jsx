import { Button, Spinner, Badge } from 'react-bootstrap';
import { useEffect, useRef } from 'react';

function PaginationLoader({ 
  loading, 
  hasMore, 
  onLoadMore, 
  currentCount, 
  totalCount,
  itemName = "elementos",
  autoLoad = false
}) {
  const observerRef = useRef();

  // Intersection Observer para scroll infinito automático
  useEffect(() => {
    if (!autoLoad) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [autoLoad, hasMore, loading, onLoadMore]);

  if (currentCount === 0) return null;

  return (
    <div className="text-center py-3">
      {/* Estadísticas */}
      <div className="mb-3">
        <Badge bg="secondary" className="fs-6">
          Mostrando {currentCount} de {totalCount} {itemName}
        </Badge>
      </div>

      {/* Botón cargar más / Loading */}
      {hasMore ? (
        <div>
          {loading ? (
            <div className="d-flex align-items-center justify-content-center">
              <Spinner animation="border" size="sm" className="me-2" />
              <span>Cargando más {itemName}...</span>
            </div>
          ) : (
            <Button 
              variant="outline-primary" 
              onClick={onLoadMore}
              disabled={loading}
            >
              Cargar más {itemName}
            </Button>
          )}
        </div>
      ) : (
        <Badge bg="success">
          ✅ Todos los {itemName} cargados
        </Badge>
      )}

      {/* Elemento invisible para intersection observer */}
      {autoLoad && hasMore && <div ref={observerRef} style={{ height: '1px' }} />}
    </div>
  );
}

export default PaginationLoader; 