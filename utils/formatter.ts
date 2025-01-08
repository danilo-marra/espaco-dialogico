export const dateFormatter = new Intl.DateTimeFormat("pt-BR");
export const priceFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// Função para formatar a máscara de hora
export const maskTime = (value: string) => {
  // Remove all non-digits
  let maskedValue = value.replace(/\D/g, "");

  // Format as HH:MM
  if (value.length >= 2) {
    const hours = maskedValue.slice(0, 2);
    const minutes = maskedValue.slice(2, 4);

    // Validate hours
    if (Number.parseInt(hours) > 23) {
      maskedValue = `23${maskedValue.slice(2)}`;
    }

    // Validate minutes
    if (Number.parseInt(minutes) > 59) {
      maskedValue = `${maskedValue.slice(0, 2)}59`;
    }

    return (
      maskedValue.slice(0, 2) +
      (maskedValue.length > 2 ? `:${maskedValue.slice(2, 4)}` : "")
    );
  }

  return value;
};

export const maskPhone = (value: string) => {
  if (!value) return "";

  // Remove tudo que não for número
  let formattedValue = value.replace(/\D/g, "");

  // Limita a 11 dígitos (9 + DDD)
  formattedValue = formattedValue.slice(0, 11);

  // Aplica a máscara
  formattedValue = formattedValue.replace(/^(\d{2})(\d)/g, "($1) $2"); // Parenteses em volta do DDD
  formattedValue = formattedValue.replace(/(\d)(\d{4})$/, "$1-$2"); // Hífen antes dos últimos 4 dígitos

  return formattedValue;
};

export const maskCPF = (value: string) => {
  // Remove tudo que não for número
  let formattedValue = value.replace(/\D/g, "");

  // Limita a 11 dígitos
  formattedValue = formattedValue.slice(0, 11);

  // Aplica a máscara
  formattedValue = formattedValue.replace(/^(\d{3})(\d)/g, "$1.$2"); // Ponto após os 3 primeiros dígitos
  formattedValue = formattedValue.replace(/^(\d{3})\.(\d{3})(\d)/g, "$1.$2.$3"); // Ponto após os 3 primeiros dígitos
  formattedValue = formattedValue.replace(
    /^(\d{3})\.(\d{3})\.(\d{3})(\d)/g,
    "$1.$2.$3-$4",
  ); // Hífen após os 3 primeiros dígitos

  return formattedValue;
};

export const maskDate = (value: string): string => {
  // Remove todos os caracteres que não são dígitos
  const digits = value.replace(/\D/g, "").slice(0, 8); // Limita a 8 dígitos (ddMMyyyy)

  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  let maskedValue = day;
  if (digits.length > 2) {
    maskedValue += `/${month}`;
  }
  if (digits.length > 4) {
    maskedValue += `/${year}`;
  }

  return maskedValue;
};
