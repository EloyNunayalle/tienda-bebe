interface Props {
    currentPage: number;
    hasMore: boolean; // true si el backend devolvió lastEvaluatedKey ≠ null
    onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, hasMore, onPageChange }: Props) => {
    const handlePrev = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleNext = () => {
        if (hasMore) {
            onPageChange(currentPage + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    return (
        <div className="join">
            <button
                className="join-item btn"
                onClick={handlePrev}
                disabled={currentPage === 1}
            >
                « Anterior
            </button>

            <span className="join-item btn btn-disabled">
                Página {currentPage}
            </span>

            <button
                className="join-item btn"
                onClick={handleNext}
                disabled={!hasMore}
            >
                Siguiente »
            </button>
        </div>
    );
};

export default Pagination;
