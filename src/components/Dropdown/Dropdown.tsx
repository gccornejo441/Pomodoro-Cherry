import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import styles from "./Dropdown.module.css";
import IconRepository from "@utilities/dropDownHelpers";

interface DropdownItemProps {
  name: string;
  icon: ReactNode;
  onDropDownItemClick: (name: string) => void;
}

const DropdownItem = ({
  name,
  icon,
  onDropDownItemClick,
}: DropdownItemProps) => (
  <button
    onClick={() => onDropDownItemClick(name)}
    className={styles.menuLink}
    aria-label={`Open ${name} settings`}
  >
    <span className={styles.menuIcon}>{icon}</span>
    <span className={styles.menuText}>{name}</span>
  </button>
);

interface StateHandlers {
  [key: string]: React.Dispatch<React.SetStateAction<boolean>>;
}

interface DropdownProps {
  stateHandlers: StateHandlers;
  children: ReactNode;
  names: { name: string }[];
}

const Dropdown = ({ stateHandlers, children, names }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleMouseDown);
    }

    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen]);

  const onDropdownItemClick = (name: string): void => {
    if (stateHandlers[name]) {
      stateHandlers[name](true);
      setIsOpen(false);
    }
  };

  const icons = useMemo(() => IconRepository({ names }), [names]);

  return (
    <div
      className={`${styles.relative} ${styles.uiDropdownTrigger}`}
      ref={dropdownRef}
    >
      <button
        aria-expanded={isOpen}
        aria-controls="dropdown"
        aria-haspopup="true"
        aria-label="Open dropdown"
        className="controlButton"
        onClick={toggleDropdown}
      >
        {children}
      </button>
      {isOpen && (
        <div className={styles.dropdownWrapper}>
          <div className={styles.menuLinksWrapper}>
            {names.map((obj, index) => (
              <DropdownItem
                key={`${obj.name}-${index}`}
                name={obj.name}
                icon={icons[index]}
                onDropDownItemClick={() => onDropdownItemClick(obj.name)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
