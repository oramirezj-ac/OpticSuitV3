DO $$
DECLARE
    schema_record RECORD;
    table_exists BOOLEAN;
BEGIN
    FOR schema_record IN 
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast') 
          AND schema_name NOT LIKE 'pg_temp_%' 
          AND schema_name NOT LIKE 'pg_toast_temp_%'
    LOOP
        SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = schema_record.schema_name AND table_name = 'ventas') INTO table_exists;
        IF table_exists THEN
            EXECUTE format('
                UPDATE %I.ventas v
                SET paciente_id = (
                  SELECT d.paciente_id
                  FROM %I.detalle_ventas d
                  WHERE d.venta_id = v.id AND d.paciente_id IS NOT NULL
                  LIMIT 1
                )
                WHERE v.paciente_id IS NULL AND v.consulta_id IS NULL;
            ', schema_record.schema_name, schema_record.schema_name);
        END IF;
    END LOOP;
END;
$$;
