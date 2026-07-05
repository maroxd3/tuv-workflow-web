import PropTypes from "prop-types";
import { C } from "../../styles/theme";

export function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14">
      {Icon && (
        <div className="mb-1 flex h-[52px] w-[52px] items-center justify-center rounded-2xl border border-line bg-surface-up">
          <Icon size={22} color={C.t4} />
        </div>
      )}
      <div className="text-[14px] font-semibold text-t3">{title}</div>
      {sub && <div className="max-w-[280px] text-center text-[12px] leading-normal text-t4">{sub}</div>}
    </div>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  sub: PropTypes.string,
};
