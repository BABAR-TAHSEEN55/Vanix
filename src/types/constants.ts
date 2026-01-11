export const stages = [
  {
    step: "ENCRYPTING",
    log: "Generating ephemeral salt and IV vector...",
    delay: 1000,
    prog: 25,
  },
  {
    step: "SHARDING",
    log: "Slicing payload into 1,024 parity shards...",
    delay: 1500,
    prog: 50,
  },
  {
    step: "DISTRIBUTING",
    log: "Broadcasting shards to global DHT relays...",
    delay: 1500,
    prog: 75,
  },
  {
    step: "COMPLETE",
    log: "Transmission broadcast finalized. Network confirmation: OK",
    delay: 1000,
    prog: 100,
  },
];
