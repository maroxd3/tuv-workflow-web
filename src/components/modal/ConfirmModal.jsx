import PropTypes from "prop-types";
import { Check, Trash2 } from "lucide-react";
import { Modal } from "./Modal";
import { BtnG, BtnP } from "../ui/buttons";

export function ConfirmModal({ title, msg, onConfirm, onCancel, danger = true }) {
  return (
    <Modal title={title} sub={msg} onClose={onCancel} width={420}>
      <div className="mt-1 flex justify-end gap-2.5">
        <BtnG onClick={onCancel}>Abbrechen</BtnG>
        <BtnP onClick={onConfirm} danger icon={danger ? Trash2 : Check}>
          {danger ? "Endgültig löschen" : "Bestätigen"}
        </BtnP>
      </div>
    </Modal>
  );
}

ConfirmModal.propTypes = {
  title: PropTypes.string.isRequired,
  msg: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  danger: PropTypes.bool,
};
