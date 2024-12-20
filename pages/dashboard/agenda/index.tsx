import Header from "components/Header";
import Menu from "components/Menu";

export default function Agenda() {
  return (
    <div className="flex min-h-screen">
      <Menu />

      <div className="flex-1">
        <Header />
      </div>
    </div>
  );
}
