export const StatusBar = () => {
  return (
    <div className="status-bar">
      <div className="status-time">12:46</div>
      <div className="status-icons" aria-hidden="true">
        <div className="signal-bars">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="wifi-mark">
          <span />
          <span />
        </div>
        <div className="battery-mark">
          <span>13</span>
        </div>
      </div>
    </div>
  );
};
