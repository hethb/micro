export interface CardViewProps {
  /** This card is the one currently on screen. */
  active: boolean;
  /** Within ±1 of the active card, so heavy media can mount and preload. */
  nearby: boolean;
  height: number;
  width: number;
}
