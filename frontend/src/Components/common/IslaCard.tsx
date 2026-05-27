import React from "react";
import { EtiquetaIsla } from "../../etiquetas/etiquetas";
import { ISLA_NOMBRE } from "../../services/helpers";
import type { Mainplant } from "../../services/Types";
import "./IslaCard.css";

export interface HeaderColumn {
  label: string;
  className?: string; // Optional class for the header cell
}

interface IslaCardProps<T> {
  isla?: Mainplant;
  totalIslas?: number;
  headers?: HeaderColumn[];
  data?: T[];
  renderRow?: (item: T, index: number) => React.ReactNode;
  
  // Customization props
  containerClassName?: string; // Classes for the outermost div
  cardClassName?: string; // Classes for the inner card container (if any)
  tableClassName?: string; // Defaults to 'tableElements'
  headerClassName?: string; // Classes for the header
  bodyClassName?: string; // Classes for the body container
  bodyRef?: React.RefObject<any>; // Ref for the body container
  
  // Slot for extra header content (buttons, counters, etc.)
  extraHeader?: React.ReactNode;
  customHeaderContent?: React.ReactNode; // Completely replace the inside of the header th
  
  // Support for multiple tbodies if needed
  groups?: Array<{
    id: string;
    items: T[];
    className?: string;
  }>;

  // New: custom children to replace the entire table structure
  children?: React.ReactNode;
  
  // New: force a non-table layout
  layout?: "table" | "custom";
  regionClass?: string;
  useRegionClass?: boolean;
  headerStyle?: React.CSSProperties;
  headerFlexDirection?: "row" | "column";
  showHeaderLabels?: boolean;
}

/**
 * Generic component for Island/Delegation cards used across various dashboards.
 * Unifies the structure while allowing flexible content via render functions.
 */
export function IslaCard<T>({
  isla,
  totalIslas = 0,
  headers,
  data = [],
  renderRow,
  containerClassName = "col",
  cardClassName,
  tableClassName = "tableElements",
  headerClassName,
  bodyClassName,
  bodyRef,
  extraHeader,
  customHeaderContent,
  groups,
  children,
  layout = "table",
  regionClass: explicitRegionClass,
  useRegionClass = true,
  headerStyle,
  headerFlexDirection = "column",
  showHeaderLabels = true,
}: IslaCardProps<T>) {
  // Determine if it's baleares or canarias based on the number of islands
  const regionClass = useRegionClass ? (explicitRegionClass || (totalIslas > 4 ? "canarias" : "baleares")) : "";
  const finalContainerClass = `${containerClassName} ${regionClass}`;

  const renderHeader = () => {
    const rawContent = customHeaderContent || (
      <>
        {isla && (
          <EtiquetaIsla
            nombre={ISLA_NOMBRE[isla.mainplant] || isla.mainplant}
            imagen={isla.is}
          />
        )}
        {extraHeader}
      </>
    );

    const contentWrapper = (
      <div 
        className={`isla-card-header-flex ${headerClassName || ""}`} 
        style={{ 
          display: 'flex', 
          flexDirection: headerFlexDirection,
          justifyContent: 'space-between', 
          alignItems: 'center',
          width: '100%',
          ...headerStyle
        }}
      >
        {rawContent}
      </div>
    );

    if (layout === "table") {
      return (
        <thead>
          <tr className="isla-card-header-main">
            <th colSpan={headers?.length || 1} style={headerStyle}>
              {contentWrapper}
            </th>
          </tr>
          {showHeaderLabels && headers && (
            <tr className="isla-card-header-sub">
              {headers.map((h, i) => (
                <td 
                  key={i} 
                  className={`${h.className || ""} ${h.label.toLowerCase().replace(/\s+/g, '')}Guia`}
                >
                  {h.label}
                </td>
              ))}
            </tr>
          )}
        </thead>
      );
    }

    return (
      <div 
        className={headerClassName || "isla-card-header-default"}
        style={headerStyle}
      >
        {contentWrapper}
      </div>
    );
  };

  const renderTableBody = () => {
    const sections = groups || [{ id: "default", items: data, className: "" }];
    return sections.map((section) => (
      <tbody key={section.id} className={section.className || section.id}>
        {section.items.map((item, i) => renderRow?.(item, i))}
      </tbody>
    ));
  };

  return (
    <div className={finalContainerClass}>
      <div className={cardClassName}>
        {layout === "table" ? (
          <table className={tableClassName}>
            {renderHeader()}
            {children || renderTableBody()}
          </table>
        ) : (
          <>
            {renderHeader()}
            <div className={bodyClassName} ref={bodyRef}>
              {children || data.map((item, index) => renderRow?.(item, index))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
  