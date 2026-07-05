import PropTypes from "prop-types";
import { C } from "../../styles/theme";

export function SectionHead({ label, icon: Icon, right }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {Icon && (
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#4F46E514]">
            <Icon size={12} color={C.blue} />
          </div>
        )}
        <span className="text-[12px] font-bold tracking-[0.01em] text-t2">{label}</span>
      </div>
      {right}
    </div>
  );
}

SectionHead.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  right: PropTypes.node,
};
