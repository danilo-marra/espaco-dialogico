import type React from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

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
    <div className="flex items-center justify-center space-x-4 mt-4">
      {/* Botão Anterior */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`p-2 rounded-full transition-colors flex items-center justify-center ${
          currentPage === 1
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-gray-300 text-gray-700 hover:bg-gray-400 cursor-pointer"
        }`}
        title="Página anterior"
      >
        <CaretLeft size={20} weight="bold" />
      </button>

      {/* Indicador de página */}
      <div className="flex items-center justify-center px-4">
        <span className="text-sm text-gray-600 font-medium sm:text-base">
          {currentPage} / {totalPages}
        </span>
      </div>

      {/* Botão Próximo */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`p-2 rounded-full transition-colors flex items-center justify-center ${
          currentPage === totalPages
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-gray-300 text-gray-700 hover:bg-gray-400 cursor-pointer"
        }`}
        title="Próxima página"
      >
        <CaretRight size={20} weight="bold" />
      </button>
    </div>
  );
};

export default Pagination;
