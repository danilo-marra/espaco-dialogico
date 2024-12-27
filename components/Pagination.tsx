import type React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  // eslint-disable-next-line no-unused-vars
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <div className="flex justify-evenly mt-4 items-center">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 cursor-pointer"
      >
        Página Anterior
      </button>
      <span>
        Página {currentPage} de {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 cursor-pointer"
      >
        Próxima Página
      </button>
    </div>
  );
};

export default Pagination;
